import { Module } from '@nestjs/common';
import { AgentLoopService } from '@/agents/agent-loop.service';
import { LlmService } from '@/agents/llm.service';
import { OpenApiParserService } from '@/agents/openapi-parser.service';
import { ToolExecutorService } from '@/agents/tool-executor.service';
import { ToolProviderService } from '@/agents/tool-provider.service';

@Module({
  providers: [
    OpenApiParserService,
    LlmService,
    ToolExecutorService,
    AgentLoopService,
    ToolProviderService,
  ],
  exports: [
    OpenApiParserService,
    LlmService,
    AgentLoopService,
    ToolExecutorService,
    ToolProviderService,
  ],
})
export class AgentsModule {}
