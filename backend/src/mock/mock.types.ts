export type MockHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface MockResponse {
  status?: number;
  body: unknown;
}

export interface MockContext {
  state: unknown;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

export interface MockRoute {
  method: MockHttpMethod;
  path: string;
  handler: (ctx: MockContext) => MockResponse;
}

export interface MockApi {
  slug: string;
  name: string;
  blurb: string;
  samplePrompts: string[];
  spec: Record<string, unknown>;
  seed: unknown;
  routes: MockRoute[];
}
