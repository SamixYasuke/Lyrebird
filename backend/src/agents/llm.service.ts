import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentTool } from '@/agents/agent-tool';
import { ChatMessage, LlmResponse, ToolCall } from '@/agents/agent.types';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
  }>;
  model?: string;
}

@Injectable()
export class LlmService {
  constructor(private readonly config: ConfigService) {}

  async chat(
    model: string,
    messages: ChatMessage[],
    tools: AgentTool[],
  ): Promise<LlmResponse> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new LlmError('OPENROUTER_API_KEY is not configured', false);
    }

    let response: Response;
    try {
      response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: 'auto',
        }),
      });
    } catch {
      throw new LlmError('Network error calling OpenRouter', true);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new LlmError(
        `OpenRouter returned ${response.status}`,
        retryable,
        response.status,
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? null,
      toolCalls: choice?.message?.tool_calls ?? [],
      model: data.model ?? model,
    };
  }
}
