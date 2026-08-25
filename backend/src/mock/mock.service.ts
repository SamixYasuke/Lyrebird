import {
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMockApis } from '@/mock/mock-data';
import { MockApi } from '@/mock/mock.types';
import { RegisterMockDto } from '@/mock/register-mock.dto';
import { TenantsService } from '@/tenants/tenants.service';
import type { UserEntity } from '@/auth/user.entity';

@Injectable()
export class MockService {
  private readonly apis = new Map<string, MockApi>();

  constructor(
    @Optional() private readonly tenants?: TenantsService,
    @Optional() private readonly config?: ConfigService,
  ) {
    for (const api of createMockApis()) this.apis.set(api.slug, api);
  }

  index(): {
    note: string;
    mocks: {
      slug: string;
      name: string;
      blurb: string;
      specUrl: string;
      endpointCount: number;
      samplePrompts: string[];
    }[];
  } {
    return {
      note: 'Built-in mock APIs for testing Lyrebird end-to-end. Each is a self-contained company API with its own OpenAPI spec, live state, and sample prompts to try in the bot.',
      mocks: [...this.apis.values()].map((api) => ({
        slug: api.slug,
        name: api.name,
        blurb: api.blurb,
        specUrl: `/mock/${api.slug}/openapi.json`,
        endpointCount: api.routes.length,
        samplePrompts: api.samplePrompts,
      })),
    };
  }

  get(slug: string): MockApi | undefined {
    return this.apis.get(slug);
  }

  handle(
    slug: string,
    method: string,
    path: string,
    query: Record<string, string>,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): { status: number; body: unknown } | undefined {
    const api = this.apis.get(slug);
    if (!api) return undefined;

    const normalized = method.toLowerCase();
    for (const route of api.routes) {
      if (route.method !== normalized) continue;
      const params = matchRoute(route.path, path);
      if (!params) continue;
      const response = route.handler({
        state: api.seed,
        params,
        query,
        body,
        headers,
      });
      return { status: response.status ?? 200, body: response.body };
    }

    return {
      status: 404,
      body: { error: `No ${normalized.toUpperCase()} ${path} endpoint on "${slug}"` },
    };
  }

  async register(slug: string, dto: RegisterMockDto, user: UserEntity) {
    const api = this.apis.get(slug);
    if (!api) throw new NotFoundException(`No mock API "${slug}"`);
    if (!this.tenants) {
      throw new ServiceUnavailableException('TenantsService is not available');
    }

    const port = this.config?.get<number>('PORT') ?? 3000;
    return this.tenants.createService(user.id, user.tenantId, {
      name: dto.name ?? api.name,
      baseUrl: `http://127.0.0.1:${port}/mock/${slug}`,
      openapiSpec: JSON.stringify(api.spec),
      botToken: dto.botToken,
      authHeaderName: dto.authHeaderName,
      authHeaderValue: dto.authHeaderValue,
    });
  }
}

function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const names = pattern.match(/:[^/]+/g)?.map((p) => p.slice(1)) ?? [];
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
  const match = regex.exec(path);
  if (!match) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < names.length; i++) {
    params[names[i]] = decodeURIComponent(match[i + 1]);
  }
  return params;
}
