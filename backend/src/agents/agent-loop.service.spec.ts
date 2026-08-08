import { Test } from '@nestjs/testing';
import { AgentLoopService } from '@/agents/agent-loop.service';
import { LlmError, LlmService } from '@/agents/llm.service';
import { ToolExecutorService } from '@/agents/tool-executor.service';
import {
  AgentContext,
  ChatMessage,
  LlmResponse,
  ToolExecutionResult,
} from '@/agents/agent.types';
import { AgentTool } from '@/agents/agent-tool';

const makeTool = (): AgentTool => ({
  type: 'function',
  function: {
    name: 'getOrder',
    description: 'Fetch an order',
    parameters: { type: 'object', properties: {} },
  },
  metadata: {
    method: 'GET',
    path: '/orders/{orderId}',
    isMutation: false,
    security: [],
    params: { path: ['orderId'], query: [], header: [], body: [] },
  },
});

const makeMutationTool = (): AgentTool => ({
  type: 'function',
  function: {
    name: 'cancelOrder',
    description: 'Cancel an order',
    parameters: { type: 'object', properties: {} },
  },
  metadata: {
    method: 'POST',
    path: '/orders/{orderId}/cancel',
    isMutation: true,
    security: [],
    params: { path: ['orderId'], query: [], header: [], body: [] },
  },
});

const context: AgentContext = {
  baseUrl: 'https://api.example.com',
  tools: [makeTool()],
  model: 'primary-model',
  fallbackModel: 'fallback-model',
};

const history: ChatMessage[] = [{ role: 'user', content: 'Check my order 5' }];

describe('AgentLoopService', () => {
  let service: AgentLoopService;
  let llm: jest.Mocked<LlmService>;
  let executor: jest.Mocked<ToolExecutorService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgentLoopService,
        { provide: LlmService, useValue: { chat: jest.fn() } },
        { provide: ToolExecutorService, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    service = module.get(AgentLoopService);
    llm = module.get(LlmService);
    executor = module.get(ToolExecutorService);
  });

  afterEach(() => jest.clearAllMocks());

  const respond = (partial: Partial<LlmResponse>): LlmResponse => ({
    content: 'reply',
    toolCalls: [],
    model: 'm',
    ...partial,
  });

  it('returns a plain answer when the LLM does not call tools', async () => {
    llm.chat.mockResolvedValue(respond({ content: 'Your order is ready.' }));

    const result = await service.run(context, history);

    expect(result.reply).toBe('Your order is ready.');
    expect(result.iterations).toBe(1);
    expect(result.toolCalls).toHaveLength(0);
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('executes a tool call and feeds the result back to the LLM', async () => {
    const toolCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'getOrder', arguments: '{"orderId":"5"}' },
    };
    const execResult: ToolExecutionResult = {
      ok: true,
      status: 200,
      data: { status: 'shipped' },
    };

    llm.chat
      .mockResolvedValueOnce(respond({ content: null, toolCalls: [toolCall] }))
      .mockResolvedValueOnce(respond({ content: 'Order 5 was shipped.' }));
    executor.execute.mockResolvedValue(execResult);

    const result = await service.run(context, history);

    expect(executor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        function: expect.objectContaining({ name: 'getOrder' }),
      }),
      { orderId: '5' },
      expect.objectContaining({ baseUrl: 'https://api.example.com' }),
    );
    expect(result.reply).toBe('Order 5 was shipped.');
    expect(result.iterations).toBe(2);

    const toolMessage = llm.chat.mock.calls[1][1].find(
      (m) => m.role === 'tool',
    );
    expect(toolMessage).toEqual(
      expect.objectContaining({ role: 'tool', tool_call_id: 'call_1' }),
    );
  });

  it('feeds a failed tool execution back so the LLM can self-correct', async () => {
    const badCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'getOrder', arguments: '{"orderId":"5"}' },
    };
    const failure: ToolExecutionResult = {
      ok: false,
      status: 500,
      data: { error: 'boom' },
    };

    llm.chat
      .mockResolvedValueOnce(respond({ content: null, toolCalls: [badCall] }))
      .mockResolvedValueOnce(
        respond({ content: 'The API failed, please retry.' }),
      );
    executor.execute.mockResolvedValue(failure);

    const result = await service.run(context, history);

    const toolMessage = llm.chat.mock.calls[1][1].find(
      (m) => m.role === 'tool',
    );
    expect(JSON.parse(toolMessage?.content as string)).toEqual(failure);
    expect(result.reply).toBe('The API failed, please retry.');
  });

  it('throws when the loop hits the iteration limit', async () => {
    const toolCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'getOrder', arguments: '{"orderId":"5"}' },
    };
    llm.chat.mockResolvedValue(
      respond({ content: null, toolCalls: [toolCall] }),
    );
    executor.execute.mockResolvedValue({ ok: true, status: 200, data: {} });

    await expect(service.run(context, history)).rejects.toThrow('iterations');
    expect(llm.chat).toHaveBeenCalledTimes(5);
  });

  it('falls back to the fallback model on a retryable LLM error', async () => {
    llm.chat
      .mockRejectedValueOnce(new LlmError('rate limited', true, 429))
      .mockResolvedValueOnce(respond({ content: 'Recovered with fallback.' }));

    const result = await service.run(context, history);

    expect(llm.chat).toHaveBeenNthCalledWith(
      1,
      'primary-model',
      expect.anything(),
      expect.anything(),
    );
    expect(llm.chat).toHaveBeenNthCalledWith(
      2,
      'fallback-model',
      expect.anything(),
      expect.anything(),
    );
    expect(result.usedFallback).toBe(true);
    expect(result.reply).toBe('Recovered with fallback.');
  });

  it('does not propagate non-retryable LLM errors', async () => {
    llm.chat.mockRejectedValue(new LlmError('bad key', false, 401));

    await expect(service.run(context, history)).rejects.toThrow('bad key');
    expect(llm.chat).toHaveBeenCalledTimes(1);
  });

  it('retries with the fallback model on an empty response', async () => {
    llm.chat
      .mockResolvedValueOnce(respond({ content: '   ', toolCalls: [] }))
      .mockResolvedValueOnce(respond({ content: 'Here you go.' }));

    const result = await service.run(context, history);

    expect(result.usedFallback).toBe(true);
    expect(result.reply).toBe('Here you go.');
  });

  it('includes the base URL in the system prompt', async () => {
    llm.chat.mockResolvedValue(respond({}));

    await service.run(context, history);

    const systemPrompt = llm.chat.mock.calls[0][1][0];
    expect(systemPrompt.role).toBe('system');
    expect(systemPrompt.content).toContain('https://api.example.com');
  });

  it('intercepts an unconfirmed mutation tool call and does not execute it', async () => {
    const mutationCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };

    llm.chat.mockResolvedValue(
      respond({ content: null, toolCalls: [mutationCall] }),
    );

    const result = await service.run(
      { ...context, tools: [...context.tools, makeMutationTool()] },
      history,
    );

    expect(executor.execute).not.toHaveBeenCalled();
    expect(result.pendingToolCall).toEqual(mutationCall);
    expect(result.reply).toBe('May I cancel an order (5)?');
    expect(result.confirmationSummary).toBe('cancel an order (5)');
    expect(result.reply).not.toContain('cancelOrder');
    expect(result.reply).not.toContain('arguments');
  });

  it('uses an LLM-generated natural summary for the confirmation question', async () => {
    const mutationCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };

    llm.chat
      .mockResolvedValueOnce(
        respond({ content: null, toolCalls: [mutationCall] }),
      )
      .mockResolvedValueOnce(
        respond({ content: 'cancel order 5', toolCalls: [] }),
      );

    const result = await service.run(
      { ...context, tools: [...context.tools, makeMutationTool()] },
      history,
    );

    expect(result.reply).toBe('May I cancel order 5?');
    expect(result.confirmationSummary).toBe('cancel order 5');
    expect(result.reply).not.toContain('cancelOrder');
    expect(result.reply).not.toContain('(5)');
  });

  it('falls back to a deterministic summary when the summary LLM call fails', async () => {
    const mutationCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };

    llm.chat
      .mockResolvedValueOnce(
        respond({ content: null, toolCalls: [mutationCall] }),
      )
      .mockRejectedValueOnce(new Error('summary boom'));

    const result = await service.run(
      { ...context, tools: [...context.tools, makeMutationTool()] },
      history,
    );

    expect(result.reply).toBe('May I cancel an order (5)?');
    expect(result.confirmationSummary).toBe('cancel an order (5)');
  });

  it('executes a mutation tool call that the user already confirmed', async () => {
    const mutationCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };

    llm.chat
      .mockResolvedValueOnce(
        respond({ content: null, toolCalls: [mutationCall] }),
      )
      .mockResolvedValueOnce(respond({ content: 'Order 5 cancelled.' }));
    executor.execute.mockResolvedValue({ ok: true, status: 200, data: {} });

    const result = await service.run(
      {
        ...context,
        tools: [...context.tools, makeMutationTool()],
        pendingMutations: [mutationCall],
      },
      history,
    );

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(result.pendingToolCall).toBeUndefined();
    expect(result.reply).toBe('Order 5 cancelled.');
  });

  it('skips other calls in a batch when a mutation needs confirmation', async () => {
    const mutationCall = {
      id: 'call_1',
      type: 'function' as const,
      function: { name: 'cancelOrder', arguments: '{"orderId":"5"}' },
    };

    llm.chat.mockResolvedValue(
      respond({ content: null, toolCalls: [mutationCall] }),
    );

    const result = await service.run(
      { ...context, tools: [...context.tools, makeMutationTool()] },
      history,
    );

    expect(executor.execute).not.toHaveBeenCalled();
    expect(result.pendingToolCall).toEqual(mutationCall);
  });
});
