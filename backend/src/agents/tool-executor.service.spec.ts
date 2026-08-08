import { ToolExecutorService } from '@/agents/tool-executor.service';
import { AgentTool } from '@/agents/agent-tool';

describe('ToolExecutorService', () => {
  let service: ToolExecutorService;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  const makeTool = (overrides?: Partial<AgentTool>): AgentTool => ({
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
      params: { path: ['orderId'], query: ['verbose'], header: [], body: [] },
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ToolExecutorService();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '123' }),
    });
  });

  it('builds the URL with path and query params', async () => {
    await service.execute(
      makeTool(),
      { orderId: 'abc 123', verbose: true },
      { baseUrl: 'https://api.example.com/' },
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/orders/abc%20123?verbose=true');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('sends body params as JSON', async () => {
    await service.execute(
      makeTool({
        metadata: {
          method: 'POST',
          path: '/orders',
          isMutation: true,
          security: [],
          params: {
            path: [],
            query: [],
            header: [],
            body: ['item', 'quantity'],
          },
        },
      }),
      { item: 'laptop', quantity: 2 },
      { baseUrl: 'https://api.example.com' },
    );

    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ item: 'laptop', quantity: 2 });
  });

  it('injects the auth header only when the endpoint requires security', async () => {
    const secureTool = makeTool({
      metadata: { ...makeTool().metadata, security: [{ bearerAuth: [] }] },
    });
    await service.execute(
      secureTool,
      { orderId: '1' },
      {
        baseUrl: 'https://api.example.com',
        authHeaderName: 'Authorization',
        authHeaderValue: 'Bearer secret',
      },
    );

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer secret');
  });

  it('does not inject the auth header for public endpoints', async () => {
    await service.execute(
      makeTool(),
      { orderId: '1' },
      {
        baseUrl: 'https://api.example.com',
        authHeaderName: 'Authorization',
        authHeaderValue: 'Bearer secret',
      },
    );

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('returns an ok:false result on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));
    const result = await service.execute(
      makeTool(),
      { orderId: '1' },
      { baseUrl: 'https://api.example.com' },
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
  });

  it('throws when a required path param is missing', async () => {
    await expect(
      service.execute(makeTool(), {}, { baseUrl: 'https://api.example.com' }),
    ).rejects.toThrow('Missing required path parameter: orderId');
  });

  it('returns parsed JSON in the result', async () => {
    const result = await service.execute(
      makeTool(),
      { orderId: '1' },
      { baseUrl: 'https://api.example.com' },
    );
    expect(result).toEqual({ ok: true, status: 200, data: { id: '123' } });
  });
});
