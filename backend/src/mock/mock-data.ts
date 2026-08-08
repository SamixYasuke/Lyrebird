import { MockApi, MockResponse } from '@/mock/mock.types';

const ok = (body: unknown, status = 200): MockResponse => ({ status, body });
const created = (body: unknown): MockResponse => ({ status: 201, body });
const bad = (message: string): MockResponse => ({ status: 400, body: { error: message } });
const notFound = (message: string): MockResponse => ({ status: 404, body: { error: message } });
const conflict = (message: string): MockResponse => ({ status: 409, body: { error: message } });

interface StoreOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface StoreOrder {
  id: string;
  status: string;
  placedAt: string;
  items: StoreOrderItem[];
  total: number;
  shippingSpeed: string;
  deliveryWindow: string;
}

interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface StoreState {
  products: StoreProduct[];
  orders: StoreOrder[];
  account: {
    name: string;
    email: string;
    membershipLevel: string;
    nextBillingDate: string;
    deleted: boolean;
    preferences: { notifyOrderUpdates: boolean; notifyPromotions: boolean };
  };
  invoices: { id: string; date: string; amount: number; status: string }[];
}

const STORE_SEED: StoreState = {
  products: [
    { id: 'p-1001', name: 'Maple Arc Compass', price: 28.5, category: 'tools', inStock: true },
    { id: 'p-1002', name: 'Bookbinder Awl Kit', price: 42, category: 'tools', inStock: true },
    { id: 'p-1003', name: 'Tanned Hide (sq. ft.)', price: 18.75, category: 'leather', inStock: false },
    { id: 'p-1004', name: 'Sanded Walnut Pen Blanks', price: 12, category: 'wood', inStock: true },
    { id: 'p-1005', name: 'Hand Forged Hinge Set', price: 34.9, category: 'wood', inStock: true },
  ],
  orders: [
    {
      id: 'o-1021',
      status: 'delivered',
      placedAt: '2026-07-19T09:12:00Z',
      items: [{ productId: 'p-1001', name: 'Maple Arc Compass', quantity: 1, price: 28.5 }],
      total: 28.5,
      shippingSpeed: 'standard',
      deliveryWindow: 'morning',
    },
    {
      id: 'o-1022',
      status: 'shipped',
      placedAt: '2026-08-01T14:03:00Z',
      items: [{ productId: 'p-1004', name: 'Sanded Walnut Pen Blanks', quantity: 4, price: 12 }],
      total: 48,
      shippingSpeed: 'express',
      deliveryWindow: 'afternoon',
    },
    {
      id: 'o-1023',
      status: 'processing',
      placedAt: '2026-08-07T10:47:00Z',
      items: [{ productId: 'p-1005', name: 'Hand Forged Hinge Set', quantity: 2, price: 34.9 }],
      total: 69.8,
      shippingSpeed: 'standard',
      deliveryWindow: 'evening',
    },
  ],
  account: {
    name: 'Rowan Blythe',
    email: 'rowan@example.com',
    membershipLevel: 'feather',
    nextBillingDate: '2026-09-01',
    deleted: false,
    preferences: { notifyOrderUpdates: true, notifyPromotions: false },
  },
  invoices: [
    { id: 'inv-3301', date: '2026-08-01', amount: 12.0, status: 'paid' },
    { id: 'inv-3302', date: '2026-07-01', amount: 12.0, status: 'paid' },
  ],
};

interface StreamTitle {
  title: string;
  genre: string;
  year: number;
  runtimeMinutes: number;
  availableIn: string[];
}

interface StreamState {
  account: {
    plan: string;
    status: string;
    nextPaymentDate: string;
    pausedUntil: string | null;
    deleted: boolean;
  };
  catalog: StreamTitle[];
  watchlist: string[];
}

const STREAM_SEED: StreamState = {
  account: {
    plan: 'base',
    status: 'active',
    nextPaymentDate: '2026-08-15',
    pausedUntil: null,
    deleted: false,
  },
  catalog: [
    { title: 'The Salt Road', genre: 'drama', year: 2024, runtimeMinutes: 118, availableIn: ['4k', 'hd'] },
    { title: 'Whistlestop', genre: 'comedy', year: 2023, runtimeMinutes: 94, availableIn: ['hd'] },
    { title: 'Iron Orchard', genre: 'documentary', year: 2025, runtimeMinutes: 87, availableIn: ['4k', 'hd', 'sd'] },
    { title: 'The Quiet Line', genre: 'drama', year: 2022, runtimeMinutes: 121, availableIn: ['hd', 'sd'] },
  ],
  watchlist: ['The Salt Road', 'Whistlestop'],
};

interface DispatchDelivery {
  tracking: string;
  recipient: string;
  zone: string;
  weightKg: number;
  status: string;
  eta: string;
  window: string;
  price: number;
  rating: { score: number; comment?: string } | null;
}

interface DispatchState {
  deliveries: DispatchDelivery[];
  zones: Record<string, number>;
}

const DISPATCH_SEED: DispatchState = {
  deliveries: [
    {
      tracking: 'SW-4821-101',
      recipient: 'Mara Okafor',
      zone: 'metro',
      weightKg: 2.4,
      status: 'out-for-delivery',
      eta: 'Today 14:00-17:00',
      window: 'afternoon',
      price: 18.0,
      rating: null,
    },
    {
      tracking: 'SW-4821-102',
      recipient: 'Jonas Held',
      zone: 'national',
      weightKg: 11.2,
      status: 'in-transit',
      eta: 'Tomorrow',
      window: 'morning',
      price: 46.5,
      rating: null,
    },
    {
      tracking: 'SW-4821-103',
      recipient: 'Priya Nair',
      zone: 'local',
      weightKg: 0.9,
      status: 'at-sort-center',
      eta: 'In 2 days',
      window: 'evening',
      price: 12.0,
      rating: null,
    },
  ],
  zones: { local: 12, metro: 18, national: 46.5 },
};

const WINDOWS = ['morning', 'afternoon', 'evening'] as const;

function storeRoutes(): MockApi['routes'] {
  return [
    {
      method: 'get',
      path: '/products',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const category = ctx.query.category;
        const products = category ? s.products.filter((p) => p.category === category) : s.products;
        return ok(products);
      },
    },
    {
      method: 'get',
      path: '/orders',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const status = ctx.query.status;
        const orders = status ? s.orders.filter((o) => o.status === status) : s.orders;
        return ok(orders);
      },
    },
    {
      method: 'get',
      path: '/orders/:orderId',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const order = s.orders.find((o) => o.id === ctx.params.orderId);
        return order ? ok(order) : notFound(`Order ${ctx.params.orderId} not found`);
      },
    },
    {
      method: 'post',
      path: '/orders',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const productId = String(ctx.body.productId ?? '');
        const quantity = Number(ctx.body.quantity ?? NaN);
        const product = s.products.find((p) => p.id === productId);
        if (!product) return bad(`Unknown product "${productId}"`);
        if (!Number.isInteger(quantity) || quantity < 1) {
          return bad('quantity must be an integer >= 1');
        }
        const next = Math.max(0, ...s.orders.map((o) => Number(o.id.split('-')[1]))) + 1;
        const order: StoreOrder = {
          id: `o-${next}`,
          status: 'processing',
          placedAt: new Date().toISOString(),
          items: [{ productId, name: product.name, quantity, price: product.price }],
          total: Math.round(product.price * quantity * 100) / 100,
          shippingSpeed: ctx.body.shippingSpeed === 'express' ? 'express' : 'standard',
          deliveryWindow: 'evening',
        };
        s.orders.push(order);
        return created(order);
      },
    },
    {
      method: 'post',
      path: '/orders/:orderId/cancel',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const order = s.orders.find((o) => o.id === ctx.params.orderId);
        if (!order) return notFound(`Order ${ctx.params.orderId} not found`);
        if (order.status === 'shipped' || order.status === 'delivered') {
          return conflict('This order has already been shipped and cannot be cancelled');
        }
        if (order.status === 'cancelled') return bad('This order is already cancelled');
        order.status = 'cancelled';
        return ok({ ok: true, order });
      },
    },
    {
      method: 'get',
      path: '/account',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        if (s.account.deleted) return notFound('No account found');
        return ok(s.account);
      },
    },
    {
      method: 'patch',
      path: '/account/preferences',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        const prefs = s.account.preferences;
        if (typeof ctx.body.notifyOrderUpdates === 'boolean') {
          prefs.notifyOrderUpdates = ctx.body.notifyOrderUpdates;
        }
        if (typeof ctx.body.notifyPromotions === 'boolean') {
          prefs.notifyPromotions = ctx.body.notifyPromotions;
        }
        return ok({ ok: true, preferences: prefs });
      },
    },
    {
      method: 'delete',
      path: '/account',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        if (s.account.deleted) return notFound('No account found');
        s.account.deleted = true;
        return ok({ ok: true, message: 'Your account and personal data have been deleted' });
      },
    },
    {
      method: 'get',
      path: '/invoices',
      handler: (ctx) => {
        const s = ctx.state as StoreState;
        return ok(s.invoices);
      },
    },
  ];
}

function streamRoutes(): MockApi['routes'] {
  return [
    {
      method: 'get',
      path: '/account',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        if (s.account.deleted) return notFound('No account found');
        return ok(s.account);
      },
    },
    {
      method: 'get',
      path: '/catalog',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        const genre = ctx.query.genre;
        const titles = genre ? s.catalog.filter((t) => t.genre === genre) : s.catalog;
        return ok(titles);
      },
    },
    {
      method: 'get',
      path: '/catalog/:title',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        const title = s.catalog.find((t) => t.title === ctx.params.title);
        return title ? ok(title) : notFound(`Title "${ctx.params.title}" not in the catalog`);
      },
    },
    {
      method: 'get',
      path: '/watchlist',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        return ok(s.watchlist);
      },
    },
    {
      method: 'post',
      path: '/watchlist',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        const title = String(ctx.body.title ?? '');
        if (!s.catalog.some((t) => t.title === title)) {
          return bad(`"${title}" is not in the catalog`);
        }
        if (s.watchlist.includes(title)) return conflict(`"${title}" is already in your watchlist`);
        s.watchlist.push(title);
        return created({ ok: true, watchlist: s.watchlist });
      },
    },
    {
      method: 'delete',
      path: '/watchlist/:title',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        const index = s.watchlist.indexOf(ctx.params.title);
        if (index === -1) return notFound(`"${ctx.params.title}" is not in your watchlist`);
        s.watchlist.splice(index, 1);
        return ok({ ok: true, watchlist: s.watchlist });
      },
    },
    {
      method: 'patch',
      path: '/subscription',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        const plan = String(ctx.body.plan ?? '');
        if (!['base', 'premium', 'duo'].includes(plan)) {
          return bad(`Unknown plan "${plan}" (expected base, premium or duo)`);
        }
        s.account.plan = plan;
        return ok({ ok: true, account: s.account });
      },
    },
    {
      method: 'post',
      path: '/subscription/pause',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        if (s.account.status === 'paused') return bad('Subscription is already paused');
        s.account.status = 'paused';
        s.account.pausedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        return ok({ ok: true, account: s.account });
      },
    },
    {
      method: 'post',
      path: '/subscription/resume',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        if (s.account.status !== 'paused') return bad('Subscription is not paused');
        s.account.status = 'active';
        s.account.pausedUntil = null;
        return ok({ ok: true, account: s.account });
      },
    },
    {
      method: 'delete',
      path: '/account',
      handler: (ctx) => {
        const s = ctx.state as StreamState;
        if (s.account.deleted) return notFound('No account found');
        s.account.deleted = true;
        return ok({ ok: true, message: 'Your subscription is cancelled and your account has been deleted' });
      },
    },
  ];
}

function dispatchRoutes(): MockApi['routes'] {
  const zoneBase = (s: DispatchState, zone: string) => s.zones[zone];

  return [
    {
      method: 'get',
      path: '/deliveries',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        return ok(s.deliveries);
      },
    },
    {
      method: 'get',
      path: '/deliveries/:tracking',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        const delivery = s.deliveries.find((d) => d.tracking === ctx.params.tracking);
        return delivery ? ok(delivery) : notFound(`No delivery with tracking code ${ctx.params.tracking}`);
      },
    },
    {
      method: 'post',
      path: '/deliveries',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        const zone = String(ctx.body.zone ?? '');
        const weightKg = Number(ctx.body.weightKg ?? NaN);
        if (zoneBase(s, zone) === undefined) {
          return bad(`Unknown zone "${zone}" (expected ${Object.keys(s.zones).join(', ')})`);
        }
        if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 70) {
          return bad('weightKg must be a number between 0 and 70');
        }
        const next =
          Math.max(
            0,
            ...s.deliveries.map((d) => Number(d.tracking.split('-').pop() ?? '0')),
          ) + 1;
        const price = Math.round((zoneBase(s, zone) + weightKg * 0.5) * 100) / 100;
        const delivery: DispatchDelivery = {
          tracking: `SW-4821-${next}`,
          recipient: String(ctx.body.recipientName ?? 'Unknown recipient'),
          zone,
          weightKg,
          status: 'at-sort-center',
          eta: 'In 2 days',
          window: 'evening',
          price,
          rating: null,
        };
        s.deliveries.push(delivery);
        return created(delivery);
      },
    },
    {
      method: 'post',
      path: '/deliveries/:tracking/reschedule',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        const delivery = s.deliveries.find((d) => d.tracking === ctx.params.tracking);
        if (!delivery) return notFound(`No delivery with tracking code ${ctx.params.tracking}`);
        const window = String(ctx.body.window ?? '');
        if (!(WINDOWS as readonly string[]).includes(window)) {
          return bad(`Unknown delivery window "${window}" (expected ${WINDOWS.join(', ')})`);
        }
        delivery.window = window;
        return ok({ ok: true, delivery });
      },
    },
    {
      method: 'post',
      path: '/deliveries/:tracking/rate',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        const delivery = s.deliveries.find((d) => d.tracking === ctx.params.tracking);
        if (!delivery) return notFound(`No delivery with tracking code ${ctx.params.tracking}`);
        const score = Number(ctx.body.score ?? NaN);
        if (!Number.isInteger(score) || score < 1 || score > 5) {
          return bad('score must be an integer between 1 and 5');
        }
        delivery.rating = { score, comment: typeof ctx.body.comment === 'string' ? ctx.body.comment : undefined };
        return ok({ ok: true, delivery });
      },
    },
    {
      method: 'get',
      path: '/prices',
      handler: (ctx) => {
        const s = ctx.state as DispatchState;
        const zone = String(ctx.query.zone ?? '');
        const weightKg = Number(ctx.query.weightKg ?? NaN);
        if (zoneBase(s, zone) === undefined) {
          return bad(`Unknown zone "${zone}" (expected ${Object.keys(s.zones).join(', ')})`);
        }
        if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 70) {
          return bad('weightKg must be a number between 0 and 70');
        }
        const price = Math.round((zoneBase(s, zone) + weightKg * 0.5) * 100) / 100;
        return ok({ zone, weightKg, price });
      },
    },
  ];
}

const SPEC_META = {
  openapi: '3.0.3',
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
  },
  security: [{ ApiKeyAuth: [] }],
} as const;

const okResponse = { '200': { description: 'ok' } };

const STORE_SPEC = {
  ...SPEC_META,
  info: { title: 'Feather & Forge Store API', version: '1.0.0' },
  paths: {
    '/products': {
      get: {
        operationId: 'listProducts',
        summary: 'List the products you can order',
        description: 'Returns the current product catalog with prices and stock.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            required: false,
            description: 'Filter by category (tools, wood, leather).',
            schema: { type: 'string', enum: ['tools', 'wood', 'leather'] },
          },
        ],
        responses: okResponse,
      },
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        summary: 'List your orders',
        description: 'Returns the orders on your account, optionally filtered by status.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter by order status.',
            schema: { type: 'string', enum: ['processing', 'shipped', 'delivered', 'cancelled'] },
          },
        ],
        responses: okResponse,
      },
      post: {
        operationId: 'placeOrder',
        summary: 'Place a new order',
        description: 'Creates an order for a product. Mutates your account.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string', description: 'The product id to order.' },
                  quantity: { type: 'integer', minimum: 1, description: 'How many to order.' },
                  shippingSpeed: {
                    type: 'string',
                    enum: ['standard', 'express'],
                    description: 'Shipping speed (defaults to standard).',
                  },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Order created' }, '400': { description: 'Bad request' } },
      },
    },
    '/orders/{orderId}': {
      get: {
        operationId: 'getOrder',
        summary: 'Get order details and status',
        description: 'Returns a single order including its current status and items.',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            description: 'The order id (e.g. o-1023).',
            schema: { type: 'string' },
          },
        ],
        responses: okResponse,
      },
    },
    '/orders/{orderId}/cancel': {
      post: {
        operationId: 'cancelOrder',
        summary: 'Cancel an order',
        description: 'Cancels an order that has not shipped yet. Mutates the order.',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            description: 'The order id (e.g. o-1023).',
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Cancelled' }, '409': { description: 'Already shipped' } },
      },
    },
    '/account': {
      get: {
        operationId: 'getAccount',
        summary: 'Get your profile and membership',
        description: 'Returns the account profile, membership level and billing date.',
        responses: okResponse,
      },
      delete: {
        operationId: 'deleteAccount',
        summary: 'Delete your account',
        description: 'Permanently deletes your account and personal data. Mutates your account.',
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/account/preferences': {
      patch: {
        operationId: 'updatePreferences',
        summary: 'Update notification preferences',
        description: 'Changes which notifications you receive. Mutates your account.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifyOrderUpdates: { type: 'boolean', description: 'Order status notifications.' },
                  notifyPromotions: { type: 'boolean', description: 'Promotional emails.' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/invoices': {
      get: {
        operationId: 'listInvoices',
        summary: 'List your invoices',
        description: 'Returns your billing history.',
        responses: okResponse,
      },
    },
  },
};

const STREAM_SPEC = {
  ...SPEC_META,
  info: { title: 'Nova Cinema API', version: '1.0.0' },
  paths: {
    '/account': {
      get: {
        operationId: 'getSubscription',
        summary: 'Get your subscription status',
        description: 'Returns your plan, billing status and next payment date.',
        responses: okResponse,
      },
      delete: {
        operationId: 'cancelAccount',
        summary: 'Cancel your subscription and delete the account',
        description: 'Cancels billing and permanently deletes the account. Mutates your account.',
        responses: { '200': { description: 'Cancelled' } },
      },
    },
    '/catalog': {
      get: {
        operationId: 'listCatalog',
        summary: 'Browse the catalog',
        description: 'Returns available titles, optionally filtered by genre.',
        parameters: [
          {
            name: 'genre',
            in: 'query',
            required: false,
            description: 'Filter by genre (drama, comedy, documentary).',
            schema: { type: 'string' },
          },
        ],
        responses: okResponse,
      },
    },
    '/catalog/{title}': {
      get: {
        operationId: 'getTitle',
        summary: 'Get title details',
        description: 'Returns details and availability for a single title.',
        parameters: [
          {
            name: 'title',
            in: 'path',
            required: true,
            description: 'Exact title (e.g. The Salt Road).',
            schema: { type: 'string' },
          },
        ],
        responses: okResponse,
      },
    },
    '/watchlist': {
      get: {
        operationId: 'listWatchlist',
        summary: 'Get your watchlist',
        description: 'Returns the titles you have saved.',
        responses: okResponse,
      },
      post: {
        operationId: 'addToWatchlist',
        summary: 'Add a title to your watchlist',
        description: 'Saves a title to your watchlist. Mutates your watchlist.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: { title: { type: 'string', description: 'Exact title from the catalog.' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Added' }, '400': { description: 'Not in catalog' } },
      },
    },
    '/watchlist/{title}': {
      delete: {
        operationId: 'removeFromWatchlist',
        summary: 'Remove a title from your watchlist',
        description: 'Removes a saved title. Mutates your watchlist.',
        parameters: [
          {
            name: 'title',
            in: 'path',
            required: true,
            description: 'Exact title to remove.',
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Removed' }, '404': { description: 'Not in watchlist' } },
      },
    },
    '/subscription': {
      patch: {
        operationId: 'changePlan',
        summary: 'Change your plan',
        description: 'Switches your plan between base, premium and duo. Mutates your subscription.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan'],
                properties: { plan: { type: 'string', enum: ['base', 'premium', 'duo'] } },
              },
            },
          },
        },
        responses: { '200': { description: 'Changed' }, '400': { description: 'Unknown plan' } },
      },
    },
    '/subscription/pause': {
      post: {
        operationId: 'pauseSubscription',
        summary: 'Pause your subscription',
        description: 'Pauses billing for 30 days. Mutates your subscription.',
        responses: { '200': { description: 'Paused' }, '400': { description: 'Already paused' } },
      },
    },
    '/subscription/resume': {
      post: {
        operationId: 'resumeSubscription',
        summary: 'Resume your subscription',
        description: 'Resumes billing after a pause. Mutates your subscription.',
        responses: { '200': { description: 'Resumed' }, '400': { description: 'Not paused' } },
      },
    },
  },
};

const DISPATCH_SPEC = {
  ...SPEC_META,
  info: { title: 'Swift Post Courier API', version: '1.0.0' },
  paths: {
    '/deliveries': {
      get: {
        operationId: 'listDeliveries',
        summary: 'List active deliveries',
        description: 'Returns your current deliveries with status and ETA.',
        responses: okResponse,
      },
      post: {
        operationId: 'createDelivery',
        summary: 'Create a shipment',
        description: 'Books a new parcel and returns the tracking code and price. Mutates your deliveries.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientName', 'zone', 'weightKg'],
                properties: {
                  recipientName: { type: 'string', description: 'Recipient name.' },
                  zone: {
                    type: 'string',
                    enum: ['local', 'metro', 'national'],
                    description: 'Delivery zone.',
                  },
                  weightKg: { type: 'number', minimum: 0, maximum: 70, description: 'Parcel weight.' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '400': { description: 'Bad request' } },
      },
    },
    '/deliveries/{tracking}': {
      get: {
        operationId: 'trackDelivery',
        summary: 'Track a parcel',
        description: 'Returns the live status and ETA for a tracking code.',
        parameters: [
          {
            name: 'tracking',
            in: 'path',
            required: true,
            description: 'Tracking code (e.g. SW-4821-101).',
            schema: { type: 'string' },
          },
        ],
        responses: okResponse,
      },
    },
    '/deliveries/{tracking}/reschedule': {
      post: {
        operationId: 'rescheduleDelivery',
        summary: 'Reschedule a delivery window',
        description: 'Changes the requested delivery window. Mutates the delivery.',
        parameters: [
          {
            name: 'tracking',
            in: 'path',
            required: true,
            description: 'Tracking code (e.g. SW-4821-101).',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['window'],
                properties: {
                  window: {
                    type: 'string',
                    enum: ['morning', 'afternoon', 'evening'],
                    description: 'Preferred delivery window.',
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Rescheduled' }, '400': { description: 'Bad request' } },
      },
    },
    '/deliveries/{tracking}/rate': {
      post: {
        operationId: 'rateDelivery',
        summary: 'Rate a delivery',
        description: 'Leaves a 1-5 star rating for a completed delivery. Mutates the delivery.',
        parameters: [
          {
            name: 'tracking',
            in: 'path',
            required: true,
            description: 'Tracking code (e.g. SW-4821-101).',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['score'],
                properties: {
                  score: { type: 'integer', minimum: 1, maximum: 5, description: '1-5 stars.' },
                  comment: { type: 'string', description: 'Optional feedback.' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Rated' }, '400': { description: 'Bad request' } },
      },
    },
    '/prices': {
      get: {
        operationId: 'quotePrice',
        summary: 'Get a price quote',
        description: 'Quotes a delivery price for a zone and parcel weight.',
        parameters: [
          {
            name: 'zone',
            in: 'query',
            required: true,
            description: 'Delivery zone (local, metro or national).',
            schema: { type: 'string', enum: ['local', 'metro', 'national'] },
          },
          {
            name: 'weightKg',
            in: 'query',
            required: true,
            description: 'Parcel weight in kg.',
            schema: { type: 'number' },
          },
        ],
        responses: okResponse,
      },
    },
  },
};

export function createMockApis(): MockApi[] {
  return [
    {
      slug: 'store',
      name: 'Feather & Forge Store',
      blurb: 'An online makers-supply shop: catalog, orders, membership, invoices.',
      samplePrompts: [
        "What's my current membership?",
        'Where is order o-1023?',
        'Cancel order o-1023 for me',
        'Place an order for 2 Sanded Walnut Pen Blanks',
        'Turn off promotional notifications',
      ],
      spec: STORE_SPEC,
      seed: JSON.parse(JSON.stringify(STORE_SEED)),
      routes: storeRoutes(),
    },
    {
      slug: 'stream',
      name: 'Nova Cinema',
      blurb: 'A streaming subscription: plans, watchlist, pause and resume billing.',
      samplePrompts: [
        'What plan am I on?',
        'Pause my subscription for a month',
        'Add The Salt Road to my watchlist',
        "Switch me to the premium plan",
        'What drama is available?',
      ],
      spec: STREAM_SPEC,
      seed: JSON.parse(JSON.stringify(STREAM_SEED)),
      routes: streamRoutes(),
    },
    {
      slug: 'dispatch',
      name: 'Swift Post Courier',
      blurb: 'A courier and tracking service: quotes, shipments, rescheduling, ratings.',
      samplePrompts: [
        'Track SW-4821-101',
        'How much to send a 5kg parcel to the metro zone?',
        'Reschedule SW-4821-102 to the evening',
        'Rate delivery SW-4821-101 5 stars',
      ],
      spec: DISPATCH_SPEC,
      seed: JSON.parse(JSON.stringify(DISPATCH_SEED)),
      routes: dispatchRoutes(),
    },
  ];
}
