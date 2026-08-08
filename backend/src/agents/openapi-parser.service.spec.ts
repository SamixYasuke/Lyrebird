import { Test, TestingModule } from '@nestjs/testing';
import { OpenApiParserService } from '@/agents/openapi-parser.service';

const SAMPLE_SPEC = `
openapi: 3.0.3
info:
  title: Demo Store API
  version: 1.0.0
servers:
  - url: https://api.example.com
security:
  - bearerAuth: []
paths:
  /orders/{orderId}:
    get:
      operationId: getOrder
      summary: Fetch a single order by ID
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
        - name: verbose
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: OK
    delete:
      operationId: cancelOrder
      summary: Cancel an order
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: No Content
  /orders:
    post:
      operationId: createOrder
      summary: Place a new order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewOrder'
      responses:
        '201':
          description: Created
  /health:
    get:
      responses:
        '200':
          description: OK
components:
  schemas:
    NewOrder:
      type: object
      required:
        - item
        - quantity
      properties:
        item:
          type: string
        quantity:
          type: integer
        note:
          type: string
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
`;

describe('OpenApiParserService', () => {
  let service: OpenApiParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiParserService],
    }).compile();

    service = module.get(OpenApiParserService);
  });

  it('parses every operation into a tool', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    expect(tools).toHaveLength(4);
  });

  it('uses operationId as the tool name', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const names = tools.map((t) => t.function.name);
    expect(names).toContain('getOrder');
    expect(names).toContain('createOrder');
  });

  it('falls back to a sanitized method+path name when no operationId', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const health = tools.find((t) => t.metadata.path === '/health');
    expect(health?.function.name).toBe('get_health');
  });

  it('marks mutations correctly', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const getOrder = tools.find((t) => t.function.name === 'getOrder');
    const createOrder = tools.find((t) => t.function.name === 'createOrder');
    expect(getOrder?.metadata.isMutation).toBe(false);
    expect(createOrder?.metadata.isMutation).toBe(true);
  });

  it('combines path, query, and requestBody params into one schema', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const createOrder = tools.find((t) => t.function.name === 'createOrder');
    expect(createOrder?.function.parameters.properties).toMatchObject({
      item: { type: 'string' },
      quantity: { type: 'integer' },
      note: { type: 'string' },
    });
    expect(createOrder?.function.parameters.required).toEqual([
      'item',
      'quantity',
    ]);
  });

  it('resolves $refs inside parameter schemas', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const createOrder = tools.find((t) => t.function.name === 'createOrder');
    expect(createOrder?.function.parameters.properties.quantity).toBeDefined();
    expect(
      (
        createOrder?.function.parameters.properties.quantity as {
          $ref?: string;
        }
      ).$ref,
    ).toBeUndefined();
  });

  it('captures security requirements from the spec', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    for (const tool of tools) {
      expect(tool.metadata.security).toEqual([{ bearerAuth: [] }]);
    }
  });

  it('tracks where each parameter goes (path/query/body)', async () => {
    const tools = await service.parse(SAMPLE_SPEC);
    const getOrder = tools.find((t) => t.function.name === 'getOrder');
    expect(getOrder?.metadata.params.path).toEqual(['orderId']);
    expect(getOrder?.metadata.params.query).toEqual(['verbose']);

    const createOrder = tools.find((t) => t.function.name === 'createOrder');
    expect(createOrder?.metadata.params.body).toEqual([
      'item',
      'quantity',
      'note',
    ]);
  });

  it('throws on a spec without paths', async () => {
    await expect(
      service.parse('openapi: 3.0.0\ninfo: {title: x, version: 1}'),
    ).rejects.toThrow('missing "paths"');
  });
});
