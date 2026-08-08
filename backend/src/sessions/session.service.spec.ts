import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '@/sessions/session.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { LlmService } from '@/agents/llm.service';

describe('SessionService', () => {
  let service: SessionService;
  const redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const llm = { chat: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'OPENROUTER_MODEL' ? 'model-x' : undefined,
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: LlmService, useValue: llm },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(SessionService);
  });

  it('returns an empty session for a new chat', async () => {
    redis.get.mockResolvedValue(null);

    await expect(service.getSession('svc-1', 42)).resolves.toEqual({
      summary: null,
      history: [],
    });
  });

  it('returns the stored summary and history', async () => {
    const state = {
      summary: 'User asked about order 5.',
      history: [{ role: 'user', content: 'hi' }],
    };
    redis.get.mockResolvedValue(JSON.stringify(state));

    await expect(service.getSession('svc-1', 42)).resolves.toEqual(state);
  });

  it('returns an empty session when the stored value is corrupt', async () => {
    redis.get.mockResolvedValue('not json');

    await expect(service.getSession('svc-1', 42)).resolves.toEqual({
      summary: null,
      history: [],
    });
  });

  it('appends messages and stores state with a TTL', async () => {
    redis.get.mockResolvedValue(null);

    await service.append(
      'svc-1',
      42,
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    );

    const [key, value, flag, ttl] = redis.set.mock.calls[0];
    expect(key).toBe('session:svc-1:42');
    const stored = JSON.parse(value);
    expect(stored.summary).toBeNull();
    expect(stored.history).toHaveLength(2);
    expect(flag).toBe('EX');
    expect(ttl).toBe(24 * 60 * 60);
  });

  it('does not summarize when the history fits the token budget', async () => {
    redis.get.mockResolvedValue(null);

    await service.append('svc-1', 42, { role: 'user', content: 'hi' });

    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('summarizes old messages and keeps the newest when over budget', async () => {
    const longMessage = 'x'.repeat(20000);
    redis.get.mockResolvedValue(null);
    llm.chat.mockResolvedValue({
      content: 'User asked many things.',
      toolCalls: [],
      model: 'model-x',
    });

    await service.append('svc-1', 42, { role: 'user', content: longMessage });

    expect(llm.chat).toHaveBeenCalledTimes(1);
    expect(llm.chat).toHaveBeenCalledWith(
      'model-x',
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]),
      [],
    );
    const stored = JSON.parse(redis.set.mock.calls[0][1]);
    expect(stored.summary).toBe('User asked many things.');
    expect(Array.isArray(stored.history)).toBe(true);
  });

  it('drops old messages without a summary when the LLM fails', async () => {
    const longMessage = 'x'.repeat(20000);
    redis.get.mockResolvedValue(null);
    llm.chat.mockRejectedValue(new Error('no api key'));

    await service.append('svc-1', 42, { role: 'user', content: longMessage });

    const stored = JSON.parse(redis.set.mock.calls[0][1]);
    expect(stored.summary).toBeNull();
    expect(Array.isArray(stored.history)).toBe(true);
  });

  it('returns null pending confirmation for a fresh chat', async () => {
    redis.get.mockResolvedValue(null);

    await expect(
      service.getPendingConfirmation('svc-1', 42),
    ).resolves.toBeNull();
  });

  it('returns a stored pending confirmation', async () => {
    const pending = {
      toolCall: {
        id: 'call_1',
        type: 'function',
        function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
      },
    };
    redis.get.mockResolvedValue(JSON.stringify(pending));

    await expect(service.getPendingConfirmation('svc-1', 42)).resolves.toEqual(
      pending,
    );
  });

  it('stores a pending confirmation under its own key with a TTL', async () => {
    const pending = {
      toolCall: {
        id: 'call_1',
        type: 'function' as const,
        function: { name: 'cancelOrder', arguments: '{}' },
      },
    };

    await service.setPendingConfirmation('svc-1', 42, pending);

    const [key, value, flag, ttl] = redis.set.mock.calls[0];
    expect(key).toBe('session:confirm:svc-1:42');
    expect(JSON.parse(value)).toEqual(pending);
    expect(flag).toBe('EX');
    expect(ttl).toBe(24 * 60 * 60);
  });

  it('deletes the key when clearing a pending confirmation', async () => {
    await service.setPendingConfirmation('svc-1', 42, null);

    expect(redis.del).toHaveBeenCalledWith('session:confirm:svc-1:42');
    expect(redis.set).not.toHaveBeenCalled();
  });
});
