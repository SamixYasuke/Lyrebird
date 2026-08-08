import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '@/redis/redis.module';
import type { RedisClient } from '@/redis/redis.module';
import type { AgentTool } from '@/agents/agent-tool';
import { OpenApiParserService } from '@/agents/openapi-parser.service';

const TOOLS_CACHE_TTL_SECONDS = 60 * 60;

@Injectable()
export class ToolProviderService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly parser: OpenApiParserService,
  ) {}

  async getTools(serviceId: string, spec: string): Promise<AgentTool[]> {
    const cacheKey = `tools:${serviceId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as AgentTool[];
      } catch {
        // fall through and re-parse
      }
    }

    const tools = await this.parser.parse(spec);
    await this.redis.set(
      cacheKey,
      JSON.stringify(tools),
      'EX',
      TOOLS_CACHE_TTL_SECONDS,
    );
    return tools;
  }

  async invalidate(serviceId: string): Promise<void> {
    await this.redis.del(`tools:${serviceId}`);
  }
}
