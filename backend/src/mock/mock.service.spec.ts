import { OpenApiParserService } from '@/agents/openapi-parser.service';
import { MockService } from '@/mock/mock.service';

describe('MockService', () => {
  let service: MockService;
  let parser: OpenApiParserService;

  beforeEach(() => {
    service = new MockService();
    parser = new OpenApiParserService();
  });

  it('exposes an index of the built-in mocks', () => {
    const index = service.index();
    expect(index.mocks.map((m) => m.slug)).toEqual(['store', 'stream', 'dispatch']);
    expect(index.mocks.every((m) => m.endpointCount > 0)).toBe(true);
  });

  it.each(['store', 'stream', 'dispatch'])(
    'serves a registerable spec for "%s"',
    async (slug) => {
      const api = service.get(slug);
      expect(api).toBeDefined();

      const tools = await parser.parse(JSON.stringify(api!.spec));
      expect(tools.length).toBeGreaterThanOrEqual(5);
      expect(tools.every((t) => t.function.name.length > 0)).toBe(true);
      expect(tools.filter((t) => t.metadata.isMutation).length).toBeGreaterThan(0);
    },
  );

  it('404s on an unknown slug', () => {
    const r = service.handle('nope', 'get', '/anything', {}, {});
    expect(r).toBeUndefined();
  });

  describe('store', () => {
    it('fetches an order by id', () => {
      const r = service.handle('store', 'get', '/orders/o-1023', {}, {});
      expect(r!.status).toBe(200);
      expect((r!.body as { id: string }).id).toBe('o-1023');
    });

    it('404s on an unknown order', () => {
      const r = service.handle('store', 'get', '/orders/o-9999', {}, {});
      expect(r!.status).toBe(404);
    });

    it('places then cancels an order', () => {
      const placed = service.handle(
        'store',
        'post',
        '/orders',
        {},
        { productId: 'p-1004', quantity: 2 },
      );
      expect(placed!.status).toBe(201);
      const id = (placed!.body as { id: string }).id;

      const cancelled = service.handle('store', 'post', `/orders/${id}/cancel`, {}, {});
      expect(cancelled!.status).toBe(200);
      expect((cancelled!.body as { order: { status: string } }).order.status).toBe(
        'cancelled',
      );
    });

    it('refuses to cancel a shipped order', () => {
      const r = service.handle('store', 'post', '/orders/o-1022/cancel', {}, {});
      expect(r!.status).toBe(409);
    });

    it('rejects an unknown product on order placement', () => {
      const r = service.handle('store', 'post', '/orders', {}, { productId: 'p-404', quantity: 1 });
      expect(r!.status).toBe(400);
    });

    it('filters orders by status', () => {
      const r = service.handle('store', 'get', '/orders', { status: 'shipped' }, {});
      expect(r!.status).toBe(200);
      expect((r!.body as { id: string }[]).map((o) => o.id)).toEqual(['o-1022']);
    });
  });

  describe('stream', () => {
    it('pauses and resumes a subscription', () => {
      const paused = service.handle('stream', 'post', '/subscription/pause', {}, {});
      expect(paused!.status).toBe(200);

      const again = service.handle('stream', 'post', '/subscription/pause', {}, {});
      expect(again!.status).toBe(400);

      const resumed = service.handle('stream', 'post', '/subscription/resume', {}, {});
      expect(resumed!.status).toBe(200);
    });

    it('rejects an unknown plan', () => {
      const r = service.handle('stream', 'patch', '/subscription', {}, { plan: 'ultra' });
      expect(r!.status).toBe(400);
    });

    it('adds and removes a watchlist title', () => {
      const added = service.handle('stream', 'post', '/watchlist', {}, { title: 'Iron Orchard' });
      expect(added!.status).toBe(201);

      const removed = service.handle(
        'stream',
        'delete',
        '/watchlist/Iron%20Orchard',
        {},
        {},
      );
      expect(removed!.status).toBe(200);
    });
  });

  describe('dispatch', () => {
    it('tracks a delivery by code', () => {
      const r = service.handle('dispatch', 'get', '/deliveries/SW-4821-101', {}, {});
      expect(r!.status).toBe(200);
      expect((r!.body as { status: string }).status).toBe('out-for-delivery');
    });

    it('404s on an unknown tracking code', () => {
      const r = service.handle('dispatch', 'get', '/deliveries/SW-0000-000', {}, {});
      expect(r!.status).toBe(404);
    });

    it('quotes a price using query params', () => {
      const r = service.handle('dispatch', 'get', '/prices', { zone: 'metro', weightKg: '5' }, {});
      expect(r!.status).toBe(200);
      expect((r!.body as { price: number }).price).toBe(20.5);
    });

    it('creates a shipment then rates it', () => {
      const created = service.handle(
        'dispatch',
        'post',
        '/deliveries',
        {},
        { recipientName: 'Ana Dias', zone: 'local', weightKg: 2 },
      );
      expect(created!.status).toBe(201);
      const tracking = (created!.body as { tracking: string }).tracking;

      const rated = service.handle(
        'dispatch',
        'post',
        `/deliveries/${tracking}/rate`,
        {},
        { score: 5, comment: 'On time' },
      );
      expect(rated!.status).toBe(200);
      expect((rated!.body as { delivery: { rating: { score: number } } }).delivery.rating.score).toBe(5);
    });
  });
});
