import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { TelegramUpdatesProcessor } from '@/telegram/telegram-updates.processor';
import { ServiceEntity } from '@/tenants/service.entity';
import { ToolProviderService } from '@/agents/tool-provider.service';
import { LlmService } from '@/agents/llm.service';
import { SessionService } from '@/sessions/session.service';
import { AgentLoopService } from '@/agents/agent-loop.service';
import { CryptoService } from '@/security/crypto.service';
import { TelegramApiService } from '@/telegram/telegram-api.service';

describe('TelegramUpdatesProcessor', () => {
  let processor: TelegramUpdatesProcessor;

  const repo = { findOne: jest.fn() };
  const tools = { getTools: jest.fn() };
  const sessions = {
    getSession: jest.fn(),
    append: jest.fn(),
    getPendingConfirmation: jest.fn(),
    setPendingConfirmation: jest.fn(),
  };
  const agent = { run: jest.fn() };
  const telegram = {
    sendMessage: jest.fn(),
    sendChatAction: jest.fn(),
  };
  const llm = { chat: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'OPENROUTER_MODEL' ? 'model-x' : 'fallback-y',
    ),
  };
  const crypto = {
    decrypt: jest.fn((value: string | null) => value),
    encrypt: jest.fn((value: string) => value),
  };

  const serviceRow = {
    id: 'svc-1',
    botToken: '123:ABC',
    baseUrl: 'https://api.example.com',
    openapiSpec: 'openapi: 3.0.0',
    authHeaderName: 'X-Api-Key',
    authHeaderValue: 'secret',
  } as ServiceEntity;

  const job = {
    data: {
      serviceId: 'svc-1',
      update: {
        update_id: 7,
        message: {
          message_id: 1,
          chat: { id: 42, type: 'private' },
          text: 'Check order 5',
        },
      },
    },
  } as unknown as Job<{ serviceId: string; update: unknown }>;

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue(serviceRow);
    tools.getTools.mockResolvedValue([{ function: { name: 'getOrder' } }]);
    sessions.getSession.mockResolvedValue({ summary: null, history: [] });
    sessions.getPendingConfirmation.mockResolvedValue(null);
    agent.run.mockResolvedValue({ reply: 'Order 5 is shipped.' });
    telegram.sendMessage.mockResolvedValue(true);
    telegram.sendChatAction.mockResolvedValue(true);

    const module = await Test.createTestingModule({
      providers: [
        TelegramUpdatesProcessor,
        { provide: getRepositoryToken(ServiceEntity), useValue: repo },
        { provide: ToolProviderService, useValue: tools },
        { provide: SessionService, useValue: sessions },
        { provide: AgentLoopService, useValue: agent },
        { provide: TelegramApiService, useValue: telegram },
        { provide: LlmService, useValue: llm },
        { provide: ConfigService, useValue: config },
        { provide: CryptoService, useValue: crypto },
      ],
    }).compile();

    processor = module.get(TelegramUpdatesProcessor);
  });

  it('runs the full pipeline: service -> tools -> agent -> session -> reply', async () => {
    await processor.process(job);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'svc-1' } });
    expect(tools.getTools).toHaveBeenCalledWith('svc-1', 'openapi: 3.0.0');
    expect(sessions.getSession).toHaveBeenCalledWith('svc-1', 42);
    expect(agent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://api.example.com',
        authHeaderName: 'X-Api-Key',
        authHeaderValue: 'secret',
        model: 'model-x',
        fallbackModel: 'fallback-y',
      }),
      [
        {
          role: 'user',
          content: 'Check order 5',
        },
      ],
    );
    expect(sessions.append).toHaveBeenCalledWith(
      'svc-1',
      42,
      { role: 'user', content: 'Check order 5' },
      { role: 'assistant', content: 'Order 5 is shipped.' },
    );
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      '123:ABC',
      42,
      'Order 5 is shipped.',
    );
  });

  it('prepends the session summary to the agent context', async () => {
    sessions.getSession.mockResolvedValue({
      summary: 'User asked about order 5.',
      history: [{ role: 'user', content: 'thanks' }],
    });
    agent.run.mockResolvedValue({ reply: 'Anything else?' });

    await processor.process(job);

    expect(agent.run).toHaveBeenCalledWith(expect.anything(), [
      {
        role: 'system',
        content: 'Conversation summary so far:\nUser asked about order 5.',
      },
      { role: 'user', content: 'thanks' },
      { role: 'user', content: 'Check order 5' },
    ]);
  });

  it('returns early when the update has no text message', async () => {
    await processor.process({
      data: { serviceId: 'svc-1', update: { update_id: 7 } },
    } as unknown as Job<never>);

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(agent.run).not.toHaveBeenCalled();
  });

  it('stores a pending confirmation when a mutation needs approval', async () => {
    const pendingToolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    agent.run.mockResolvedValue({
      reply: 'I need to confirm before making changes...',
      pendingToolCall,
    });

    await processor.process(job);

    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith('svc-1', 42, {
      toolCall: pendingToolCall,
      askCount: 0,
    });
    expect(sessions.append).toHaveBeenCalledWith(
      'svc-1',
      42,
      { role: 'user', content: 'Check order 5' },
      {
        role: 'assistant',
        content: 'I need to confirm before making changes...',
      },
    );
  });

  it('passes the approved mutation to the agent when the user confirms', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 0,
    });
    agent.run.mockResolvedValue({ reply: 'Order 5 cancelled.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 8,
          message: {
            message_id: 2,
            chat: { id: 42, type: 'private' },
            text: 'yes',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(agent.run).toHaveBeenCalledWith(
      expect.objectContaining({ pendingMutations: [toolCall] }),
      expect.anything(),
    );
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith(
      'svc-1',
      42,
      null,
    );
  });

  it('does not approve the mutation when the user declines', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 0,
    });
    agent.run.mockResolvedValue({ reply: 'OK, I will not cancel it.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 9,
          message: {
            message_id: 3,
            chat: { id: 42, type: 'private' },
            text: 'no',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    const [context, messages] = agent.run.mock.calls[0];
    expect(context).not.toHaveProperty('pendingMutations');
    expect(messages).toContainEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('declined'),
      }),
    );
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith(
      'svc-1',
      42,
      null,
    );
  });

  it('treats "no" as a decline via the fast path without calling the LLM', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 0,
    });
    agent.run.mockResolvedValue({ reply: 'OK.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 10,
          message: {
            message_id: 4,
            chat: { id: 42, type: 'private' },
            text: 'no',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(llm.chat).not.toHaveBeenCalled();
    expect(agent.run).toHaveBeenCalled();
  });

  it('executes a hedged approval ("no it is fine, order it") via the LLM judge', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 0,
    });
    llm.chat.mockResolvedValue({
      content: 'CONFIRM',
      toolCalls: [],
      model: 'm',
    });
    agent.run.mockResolvedValue({ reply: 'Order 5 cancelled.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 11,
          message: {
            message_id: 5,
            chat: { id: 42, type: 'private' },
            text: 'no it is fine, order it',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(llm.chat).toHaveBeenCalledTimes(1);
    expect(agent.run).toHaveBeenCalledWith(
      expect.objectContaining({ pendingMutations: [toolCall] }),
      expect.anything(),
    );
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith(
      'svc-1',
      42,
      null,
    );
  });

  it('keeps the pending confirmation and answers normally when intent is UNCLEAR', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 1,
    });
    llm.chat.mockResolvedValue({
      content: 'UNCLEAR',
      toolCalls: [],
      model: 'm',
    });
    agent.run.mockResolvedValue({ reply: 'Shipping is free.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 12,
          message: {
            message_id: 6,
            chat: { id: 42, type: 'private' },
            text: 'how much does shipping cost?',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(agent.run).toHaveBeenCalledWith(
      expect.not.objectContaining({ pendingMutations: expect.anything() }),
      expect.anything(),
    );
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith('svc-1', 42, {
      toolCall,
      summary: 'cancel order 5',
      askCount: 2,
    });
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      '123:ABC',
      42,
      'Shipping is free.',
    );
  });

  it('drops the pending confirmation after too many unclear replies', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 2,
    });
    llm.chat.mockResolvedValue({
      content: 'UNCLEAR',
      toolCalls: [],
      model: 'm',
    });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 13,
          message: {
            message_id: 7,
            chat: { id: 42, type: 'private' },
            text: 'huh?',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(agent.run).not.toHaveBeenCalled();
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith(
      'svc-1',
      42,
      null,
    );
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      '123:ABC',
      42,
      expect.stringContaining("didn't get a clear yes or no"),
    );
  });

  it('defaults to UNCLEAR when the LLM judge call fails', async () => {
    const toolCall = {
      id: 'call_9',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };
    sessions.getPendingConfirmation.mockResolvedValue({
      toolCall,
      summary: 'cancel order 5',
      askCount: 0,
    });
    llm.chat.mockRejectedValue(new Error('judge down'));
    agent.run.mockResolvedValue({ reply: 'Sure thing.' });

    await processor.process({
      data: {
        serviceId: 'svc-1',
        update: {
          update_id: 14,
          message: {
            message_id: 8,
            chat: { id: 42, type: 'private' },
            text: 'whatever',
          },
        },
      },
    } as unknown as Job<{ serviceId: string; update: unknown }>);

    expect(agent.run).toHaveBeenCalledWith(
      expect.not.objectContaining({ pendingMutations: expect.anything() }),
      expect.anything(),
    );
    expect(sessions.setPendingConfirmation).toHaveBeenCalledWith('svc-1', 42, {
      toolCall,
      summary: 'cancel order 5',
      askCount: 1,
    });
  });
});
