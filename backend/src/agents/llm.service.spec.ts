import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmError, LlmService } from '@/agents/llm.service';
import { ChatMessage } from '@/agents/agent.types';

describe('LlmService', () => {
  let service: LlmService;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  const configWithKey = (key?: string) =>
    ({
      get: (name: string) => (name === 'OPENROUTER_API_KEY' ? key : undefined),
    }) as ConfigService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: ConfigService, useValue: configWithKey('test-key') },
      ],
    }).compile();
    service = module.get(LlmService);
  });

  it('sends the request in OpenAI-compatible format', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'hi' } }],
        model: 'm',
      }),
    });

    const messages: ChatMessage[] = [{ role: 'user', content: 'hello' }];
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'getOrder',
          description: 'x',
          parameters: { type: 'object' },
        },
        metadata: {
          method: 'GET',
          path: '/orders/{id}',
          isMutation: false,
          security: [],
          params: { path: ['id'], query: [], header: [], body: [] },
        },
      },
    ];

    await service.chat('model-x', messages, tools);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-key');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('model-x');
    expect(body.messages).toEqual(messages);
    expect(body.tools).toHaveLength(1);
    expect(body.tool_choice).toBe('auto');
  });

  it('omits tools when the list is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
    });

    await service.chat('model-x', [{ role: 'user', content: 'hi' }], []);

    const init = mockFetch.mock.calls[0][1];
    expect(JSON.parse(init.body).tools).toBeUndefined();
  });

  it('returns content and tool calls from the response', async () => {
    const toolCalls = [
      {
        id: 'call_1',
        type: 'function',
        function: { name: 'getOrder', arguments: '{"id":"123"}' },
      },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: null, tool_calls: toolCalls } }],
        model: 'm',
      }),
    });

    const result = await service.chat(
      'model-x',
      [{ role: 'user', content: 'hi' }],
      [],
    );
    expect(result.content).toBeNull();
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].function.name).toBe('getOrder');
  });

  it('marks 429 responses as retryable', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429 });

    await expect(
      service.chat('model-x', [{ role: 'user', content: 'hi' }], []),
    ).rejects.toMatchObject<Partial<LlmError>>({
      retryable: true,
      status: 429,
    });
  });

  it('captures the Retry-After header on a 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: jest.fn().mockReturnValue('5') },
    });

    await expect(
      service.chat('model-x', [{ role: 'user', content: 'hi' }], []),
    ).rejects.toMatchObject<Partial<LlmError>>({
      retryable: true,
      retryAfterSeconds: 5,
    });
  });

  it('marks 401 responses as non-retryable', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    await expect(
      service.chat('model-x', [{ role: 'user', content: 'hi' }], []),
    ).rejects.toMatchObject<Partial<LlmError>>({
      retryable: false,
      status: 401,
    });
  });

  it('throws a retryable error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      service.chat('model-x', [{ role: 'user', content: 'hi' }], []),
    ).rejects.toMatchObject<Partial<LlmError>>({ retryable: true });
  });

  it('throws a non-retryable error when the API key is missing', async () => {
    const module = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: ConfigService, useValue: configWithKey(undefined) },
      ],
    }).compile();
    const keyless = module.get(LlmService);

    await expect(
      keyless.chat('model-x', [{ role: 'user', content: 'hi' }], []),
    ).rejects.toMatchObject<Partial<LlmError>>({ retryable: false });
  });
});
