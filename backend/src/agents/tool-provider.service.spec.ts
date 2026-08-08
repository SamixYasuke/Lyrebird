import { Test } from '@nestjs/testing';
import { ToolProviderService } from '@/agents/tool-provider.service';
import { OpenApiParserService } from '@/agents/openapi-parser.service';
import { REDIS_CLIENT } from '@/redis/redis.module';

describe('ToolProviderService', () => {
  let service: ToolProviderService;
  let parser: jest.Mocked<OpenApiParserService>;
  const redis = { get: jest.fn(), set: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ToolProviderService,
        { provide: OpenApiParserService, useValue: { parse: jest.fn() } },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(ToolProviderService);
    parser = module.get(OpenApiParserService);
  });

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

  it('parses and caches tools on a cache miss', async () => {
    redis.get.mockResolvedValue(null);
    parser.parse.mockResolvedValue(tools);

    const result = await service.getTools('svc-1', 'openapi: 3.0.0');

    expect(parser.parse).toHaveBeenCalledWith('openapi: 3.0.0');
    expect(redis.set).toHaveBeenCalledWith(
      'tools:svc-1',
      JSON.stringify(tools),
      'EX',
      3600,
    );
    expect(result).toEqual(tools);
  });

  it('returns cached tools without re-parsing', async () => {
    redis.get.mockResolvedValue(JSON.stringify(tools));

    const result = await service.getTools('svc-1', 'ignored');

    expect(parser.parse).not.toHaveBeenCalled();
    expect(result).toEqual(tools);
  });

  it('re-parses when the cache entry is corrupt', async () => {
    redis.get.mockResolvedValue('{{bad json');
    parser.parse.mockResolvedValue(tools);

    const result = await service.getTools('svc-1', 'spec');

    expect(parser.parse).toHaveBeenCalled();
    expect(result).toEqual(tools);
  });
});
