import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { TelegramService } from '@/telegram/telegram.service';
import { ServiceEntity } from '@/tenants/service.entity';
import { CryptoService } from '@/security/crypto.service';
import { TELEGRAM_UPDATES_QUEUE } from '@/queues/queues.module';
import { REDIS_CLIENT } from '@/redis/redis.module';

describe('TelegramService', () => {
  let service: TelegramService;
  const repo = { findOne: jest.fn() };
  const queue = { add: jest.fn() };
  const redis = { set: jest.fn() };
  const crypto = {
    hashBotToken: jest.fn((token: string) => `hash:${token}`),
    decrypt: jest.fn((value: string | null) => value),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    redis.set.mockResolvedValue('OK');

    const module = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: getRepositoryToken(ServiceEntity), useValue: repo },
        { provide: getQueueToken(TELEGRAM_UPDATES_QUEUE), useValue: queue },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: CryptoService, useValue: crypto },
      ],
    }).compile();

    service = module.get(TelegramService);
  });

  const serviceRow = { id: 'svc-1', botToken: '123:ABC' } as ServiceEntity;

  it('enqueues a job for a known bot token', async () => {
    repo.findOne.mockResolvedValue(serviceRow);
    const update = {
      update_id: 1,
      message: { message_id: 1, chat: { id: 42, type: 'private' }, text: 'hi' },
    };

    await service.handleUpdate('123:ABC', update);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { botTokenHash: 'hash:123:ABC' },
    });
    expect(redis.set).toHaveBeenCalledWith(
      'dedupe:svc-1:1',
      '1',
      'EX',
      60,
      'NX',
    );
    expect(queue.add).toHaveBeenCalledWith(TELEGRAM_UPDATES_QUEUE, {
      serviceId: 'svc-1',
      update,
    });
  });

  it('ignores updates without a text message', async () => {
    await service.handleUpdate('123:ABC', { update_id: 1 });

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('ignores unknown bot tokens', async () => {
    repo.findOne.mockResolvedValue(null);

    await service.handleUpdate('unknown', {
      update_id: 1,
      message: { message_id: 1, chat: { id: 1, type: 'private' }, text: 'hi' },
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('dedupes redelivered updates', async () => {
    repo.findOne.mockResolvedValue(serviceRow);
    redis.set.mockResolvedValue(null);
    const update = {
      update_id: 1,
      message: { message_id: 1, chat: { id: 1, type: 'private' }, text: 'hi' },
    };

    await service.handleUpdate('123:ABC', update);

    expect(queue.add).not.toHaveBeenCalled();
  });
});
