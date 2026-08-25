import { randomUUID } from 'node:crypto';
import { MockApi, MockContext, MockResponse } from '@/mock/mock.types';

const ok = (body: unknown, status = 200): MockResponse => ({ status, body });
const created = (body: unknown): MockResponse => ({ status: 201, body });
const bad = (message: string): MockResponse => ({ status: 400, body: { error: message } });
const unauthorized = (message: string): MockResponse => ({ status: 401, body: { error: message } });
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

interface AuthTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface AuthAccount {
  id: string;
  label: string;
  type: 'checking' | 'savings';
  balance: number;
  transactions: AuthTransaction[];
}

interface AuthUser {
  id: string;
  username: string;
  password: string;
  name: string;
  accounts: AuthAccount[];
}

interface AuthState {
  users: AuthUser[];
  tokens: Record<string, string>;
  transferCount: number;
}

const AUTH_SEED: AuthState = {
  users: [
    {
      id: 'u-1',
      username: 'alex',
      password: 'pine42',
      name: 'Alex Rivera',
      accounts: [
        {
          id: 'acct-1001',
          label: 'Checking',
          type: 'checking',
          balance: 1240.55,
          transactions: [
            { id: 'tx-9001', date: '2026-08-05', description: 'Payroll deposit', amount: 1800.0 },
            { id: 'tx-9002', date: '2026-08-03', description: 'Rent payment', amount: -1100.0 },
            { id: 'tx-9003', date: '2026-07-28', description: 'Grocery run', amount: -86.4 },
          ],
        },
        {
          id: 'acct-1002',
          label: 'Savings',
          type: 'savings',
          balance: 4375.0,
          transactions: [
            { id: 'tx-9101', date: '2026-08-01', description: 'Monthly transfer in', amount: 250.0 },
            { id: 'tx-9102', date: '2026-07-01', description: 'Monthly transfer in', amount: 250.0 },
          ],
        },
      ],
    },
    {
      id: 'u-2',
      username: 'june',
      password: 'sable77',
      name: 'June Park',
      accounts: [
        {
          id: 'acct-2001',
          label: 'Checking',
          type: 'checking',
          balance: 820.1,
          transactions: [
            { id: 'tx-9201', date: '2026-08-06', description: 'Invoice #1182 payment', amount: 620.0 },
            { id: 'tx-9202', date: '2026-08-02', description: 'Transfer out', amount: -40.0 },
          ],
        },
      ],
    },
  ],
  tokens: {},
  transferCount: 0,
};

function authUserFor(ctx: MockContext, s: AuthState): AuthUser | undefined {
  const header = (ctx.headers?.authorization ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!header) return undefined;
  const userId = s.tokens[header];
  return userId ? s.users.find((u) => u.id === userId) : undefined;
}

const publicUser = (user: AuthUser) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  accounts: user.accounts.map((a) => ({
    id: a.id,
    label: a.label,
    type: a.type,
    balance: a.balance,
  })),
});

function authRoutes(): MockApi['routes'] {
  return [
    {
      method: 'post',
      path: '/login',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const username = String(ctx.body.username ?? '');
        const password = String(ctx.body.password ?? '');
        const user = s.users.find(
          (u) => u.username === username && u.password === password,
        );
        if (!user) return unauthorized('Invalid username or password');
        const token = `tok_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
        s.tokens[token] = user.id;
        return ok({ token, tokenType: 'bearer', user: publicUser(user) });
      },
    },
    {
      method: 'get',
      path: '/me',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const user = authUserFor(ctx, s);
        if (!user) return unauthorized('Authentication required. Log in with POST /login first.');
        return ok(publicUser(user));
      },
    },
    {
      method: 'get',
      path: '/accounts',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const user = authUserFor(ctx, s);
        if (!user) return unauthorized('Authentication required. Log in with POST /login first.');
        return ok(user.accounts.map((a) => ({ id: a.id, label: a.label, type: a.type, balance: a.balance })));
      },
    },
    {
      method: 'get',
      path: '/accounts/:accountId',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const user = authUserFor(ctx, s);
        if (!user) return unauthorized('Authentication required. Log in with POST /login first.');
        const account = user.accounts.find((a) => a.id === ctx.params.accountId);
        if (!account) return notFound(`No account with id ${ctx.params.accountId} on this user`);
        return ok(account);
      },
    },
    {
      method: 'get',
      path: '/transactions',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const user = authUserFor(ctx, s);
        if (!user) return unauthorized('Authentication required. Log in with POST /login first.');
        const accountId = ctx.query.accountId;
        const account = accountId
          ? user.accounts.find((a) => a.id === accountId)
          : undefined;
        if (accountId && !account) return notFound(`No account with id ${accountId} on this user`);
        const accounts = account ? [account] : user.accounts;
        return ok(accounts.flatMap((a) => a.transactions.map((t) => ({ accountId: a.id, ...t }))));
      },
    },
    {
      method: 'post',
      path: '/transfers',
      handler: (ctx) => {
        const s = ctx.state as AuthState;
        const user = authUserFor(ctx, s);
        if (!user) return unauthorized('Authentication required. Log in with POST /login first.');
        const fromId = String(ctx.body.fromAccountId ?? '');
        const toId = String(ctx.body.toAccountId ?? '');
        const amount = Number(ctx.body.amount ?? NaN);
        const from = user.accounts.find((a) => a.id === fromId);
        const to = user.accounts.find((a) => a.id === toId);
        if (!from || !to) return bad('Unknown account id — use one of your own accounts');
        if (from.id === to.id) return bad('Cannot transfer to the same account');
        if (!Number.isFinite(amount) || amount <= 0) {
          return bad('amount must be a positive number');
        }
        const rounded = Math.round(amount * 100) / 100;
        if (from.balance < rounded) {
          return bad(
            `Insufficient funds — ${from.label} only has $${from.balance.toFixed(2)}`,
          );
        }
        s.transferCount += 1;
        const date = new Date().toISOString().slice(0, 10);
        from.balance = Math.round((from.balance - rounded) * 100) / 100;
        to.balance = Math.round((to.balance + rounded) * 100) / 100;
        from.transactions.push({
          id: `tx-${9000 + s.transferCount}`,
          date,
          description: `Transfer to ${to.label}`,
          amount: -rounded,
        });
        to.transactions.push({
          id: `tx-${9100 + s.transferCount}`,
          date,
          description: `Transfer from ${from.label}`,
          amount: rounded,
        });
        return created({
          ok: true,
          fromAccountId: from.id,
          toAccountId: to.id,
          amount: rounded,
        });
      },
    },
  ];
}

const AUTH_SPEC = {
  openapi: '3.0.3',
  info: { title: 'Ledger & Co Banking API', version: '1.0.0' },
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer' },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/login': {
      post: {
        operationId: 'login',
        summary: 'Log in and get a token',
        description:
          'Authenticates with a username and password and returns a bearer token. ' +
          'Test accounts: username "alex" password "pine42", username "june" password ' +
          '"sable77". Every other endpoint requires the returned token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', description: 'Your username (e.g. alex).' },
                  password: { type: 'string', description: 'Your password.' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Logged in' }, '401': { description: 'Bad credentials' } },
      },
    },
    '/me': {
      get: {
        operationId: 'getMe',
        summary: 'Get your profile',
        description: 'Returns the profile and accounts of the currently logged-in user.',
        responses: { '200': { description: 'ok' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/accounts': {
      get: {
        operationId: 'listAccounts',
        summary: 'List your accounts',
        description: 'Returns your accounts with their current balances.',
        responses: { '200': { description: 'ok' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/accounts/{accountId}': {
      get: {
        operationId: 'getAccount',
        summary: 'Get an account and its transactions',
        description: 'Returns one of your accounts including its recent transactions.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            description: 'The account id (e.g. acct-1001).',
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'ok' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/transactions': {
      get: {
        operationId: 'listTransactions',
        summary: 'List transactions',
        description: 'Returns your recent transactions, optionally filtered by account.',
        parameters: [
          {
            name: 'accountId',
            in: 'query',
            required: false,
            description: 'Filter by account id.',
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'ok' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/transfers': {
      post: {
        operationId: 'createTransfer',
        summary: 'Transfer money between your accounts',
        description: 'Moves money between two of your own accounts. Mutates your balances.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fromAccountId', 'toAccountId', 'amount'],
                properties: {
                  fromAccountId: { type: 'string', description: 'Source account id.' },
                  toAccountId: { type: 'string', description: 'Destination account id.' },
                  amount: { type: 'number', minimum: 0, description: 'Amount in dollars.' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Transferred' }, '400': { description: 'Bad request' }, '401': { description: 'Unauthenticated' } },
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
    {
      slug: 'auth',
      name: 'Ledger & Co Bank',
      blurb: 'A banking API that requires authentication on every request: log in for a bearer token, then check balances, transactions and make transfers.',
      samplePrompts: [
        'Log me in as alex with password pine42',
        'What is my current balance?',
        'Show my checking account transactions',
        'Transfer $40 from checking to savings',
      ],
      spec: AUTH_SPEC,
      seed: JSON.parse(JSON.stringify(AUTH_SEED)),
      routes: authRoutes(),
    },
  ];
}
