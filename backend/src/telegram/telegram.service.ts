import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '@/redis/redis.module';
import type { RedisClient } from '@/redis/redis.module';
import { CryptoService } from '@/security/crypto.service';
import { ServiceEntity } from '@/tenants/service.entity';
import { TELEGRAM_UPDATES_QUEUE } from '@/queues/queues.module';
import type {
  TelegramUpdate,
  TelegramUpdatesJob,
} from '@/telegram/telegram.types';

const DEDUPE_TTL_SECONDS = 60;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
    @InjectQueue(TELEGRAM_UPDATES_QUEUE)
    private readonly queue: Queue<TelegramUpdatesJob>,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly crypto: CryptoService,
  ) {}

  async handleUpdate(botToken: string, update: TelegramUpdate): Promise<void> {
    if (!update?.message?.text) {
      this.logger.debug('Ignoring update without a text message');
      return;
    }

    const service = await this.services.findOne({
      where: { botTokenHash: this.crypto.hashBotToken(botToken) },
    });
    if (!service) {
      this.logger.warn(`No service found for bot token ${botToken}`);
      return;
    }

    const dedupeKey = `dedupe:${service.id}:${update.update_id}`;
    const claimed = await this.redis.set(
      dedupeKey,
      '1',
      'EX',
      DEDUPE_TTL_SECONDS,
      'NX',
    );
    if (claimed !== 'OK') {
      this.logger.debug(`Duplicate update ${update.update_id} ignored`);
      return;
    }

    await this.queue.add(TELEGRAM_UPDATES_QUEUE, {
      serviceId: service.id,
      update,
    });
  }
}
