import { Injectable } from '@nestjs/common';
import {
  AgentContext,
  ChatMessage,
  LlmResponse,
  ToolCall,
  ToolExecutionResult,
} from '@/agents/agent.types';
import { AgentTool } from '@/agents/agent-tool';
import { LlmError, LlmService } from '@/agents/llm.service';
import { ToolExecutorService } from '@/agents/tool-executor.service';

const MAX_ITERATIONS = 5;

export interface AgentResult {
  reply: string;
  iterations: number;
  usedFallback: boolean;
  toolCalls: ToolCall[];
  pendingToolCall?: ToolCall;
  confirmationSummary?: string;
}

@Injectable()
export class AgentLoopService {
  constructor(
    private readonly llm: LlmService,
    private readonly executor: ToolExecutorService,
  ) {}

  async run(
    context: AgentContext,
    history: ChatMessage[],
  ): Promise<AgentResult> {
    const messages: ChatMessage[] = [
      this.buildSystemPrompt(context),
      ...history,
    ];
    const toolCalls: ToolCall[] = [];
    let usedFallback = false;
    let iterations = 0;

    for (; iterations < MAX_ITERATIONS; iterations++) {
      const response = await this.callModel(context, messages, usedFallback);
      usedFallback = usedFallback || response.usedFallback;

      if (response.result.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: response.result.content,
          tool_calls: response.result.toolCalls,
        });
        let intercepted: ToolCall | undefined;
        for (const call of response.result.toolCalls) {
          const tool = context.tools.find(
            (t) => t.function.name === call.function.name,
          );
          const confirmed = context.pendingMutations?.some(
            (p) => p.function.name === call.function.name,
          );
          if (tool?.metadata.isMutation && !confirmed) {
            intercepted = intercepted ?? call;
            continue;
          }
          toolCalls.push(call);
          const result = await this.executeToolCall(context, call);
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
        if (intercepted) {
          const summary = await this.buildConfirmationSummary(
            intercepted,
            context,
          );
          return {
            reply: `May I ${summary}?`,
            iterations: iterations + 1,
            usedFallback,
            toolCalls,
            pendingToolCall: intercepted,
            confirmationSummary: summary,
          };
        }
        continue;
      }

      const content = response.result.content?.trim();
      if (content) {
        return {
          reply: content,
          iterations: iterations + 1,
          usedFallback,
          toolCalls,
        };
      }

      if (!usedFallback && context.fallbackModel) {
        usedFallback = true;
        const retry = await this.llm.chat(
          context.fallbackModel,
          messages,
          context.tools,
        );
        const retryContent = retry.content?.trim();
        if (retryContent) {
          return {
            reply: retryContent,
            iterations: iterations + 1,
            usedFallback,
            toolCalls,
          };
        }
      }

      return {
        reply: "I couldn't process that. Please try rephrasing.",
        iterations: iterations + 1,
        usedFallback,
        toolCalls,
      };
    }

    throw new Error(
      `Agent loop exceeded ${MAX_ITERATIONS} iterations without reaching a final answer`,
    );
  }

  private async callModel(
    context: AgentContext,
    messages: ChatMessage[],
    usedFallback: boolean,
  ): Promise<{ result: LlmResponse; usedFallback: boolean }> {
    try {
      const result = await this.llm.chat(
        context.model,
        messages,
        context.tools,
      );
      return { result, usedFallback };
    } catch (err) {
      if (
        err instanceof LlmError &&
        err.retryable &&
        !usedFallback &&
        context.fallbackModel
      ) {
        const result = await this.llm.chat(
          context.fallbackModel,
          messages,
          context.tools,
        );
        return { result, usedFallback: true };
      }
      throw err;
    }
  }

  private async executeToolCall(
    context: AgentContext,
    call: ToolCall,
  ): Promise<ToolExecutionResult> {
    const tool = context.tools.find(
      (t) => t.function.name === call.function.name,
    );
    if (!tool) {
      return {
        ok: false,
        status: 0,
        data: { error: `Unknown tool: ${call.function.name}` },
      };
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(call.function.arguments) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        status: 0,
        data: { error: 'Tool arguments were not valid JSON' },
      };
    }

    try {
      return await this.executor.execute(tool, args, {
        baseUrl: context.baseUrl,
        authHeaderName: context.authHeaderName,
        authHeaderValue: context.authHeaderValue,
      });
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  private async buildConfirmationSummary(
    call: ToolCall,
    context: AgentContext,
  ): Promise<string> {
    const tool = context.tools.find(
      (t) => t.function.name === call.function.name,
    );
    const description = tool?.function.description ?? call.function.name;
    try {
      const response = await this.llm.chat(
        context.model,
        [
          {
            role: 'system',
            content:
              'You write the shortest natural-language summary of one action a ' +
              'Telegram customer just asked for, phrased from the customer\'s ' +
              'perspective. Start with a verb in the present tense. Use the ' +
              'action name, its description, and the argument values. Output ' +
              'ONLY the summary sentence, e.g. "place an order for 1 Maple Arc ' +
              'Compass with standard shipping" or "add The Salt Road to your ' +
              'watchlist". No quotes, no leading capital, no trailing period.',
          },
          {
            role: 'user',
            content: `Action: ${call.function.name}\nDescription: ${description}\nArguments: ${call.function.arguments}`,
          },
        ],
        [],
      );
      const summary = response.content?.trim();
      if (summary && summary.length <= 160 && !summary.includes('\n')) {
        return summary;
      }
    } catch {
      // fall through to the deterministic summary
    }
    return this.deterministicSummary(call, context.tools);
  }

  private deterministicSummary(call: ToolCall, tools: AgentTool[]): string {
    const tool = tools.find((t) => t.function.name === call.function.name);
    const action = tool ? this.humanizeAction(tool.function.description) : '';
    const detail = this.humanizeArgs(call.function.arguments);
    const base = action ? action : 'do that';
    return detail ? `${base} (${detail})` : base;
  }

  private humanizeAction(description: string): string {
    const firstLine = description.split('\n')[0]?.trim() ?? '';
    const sentence = firstLine.split(/[.!?]/)[0]?.trim() ?? firstLine;
    const action = sentence.charAt(0).toLowerCase() + sentence.slice(1);
    return action || '';
  }

  private humanizeArgs(rawArguments: string): string {
    try {
      const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
      return Object.values(parsed)
        .map((value) => String(value))
        .filter((value) => value.length > 0)
        .join(', ');
    } catch {
      return '';
    }
  }

  private buildSystemPrompt(context: AgentContext): ChatMessage {
    const lines = [
      'You are a helpful assistant that operates a company API on behalf of the user.',
      `The API base URL is: ${context.baseUrl}`,
      'Use the provided tools to fulfill the user request.',
      'Only answer requests related to the product this API serves.',
      'If a request cannot be fulfilled with the provided tools, politely say so and ' +
        'guide the user back to what you can do. Never answer general-knowledge or ' +
        'off-topic questions, even if you know the answer.',
      'Never mention internal tool names or operation IDs to the user; describe ' +
        'actions in natural language only.',
      'Use plain ASCII hyphens (-) in identifiers such as tracking codes, never ' +
        'typographic dashes.',
      'Never use emojis or decorative symbols in replies.',
      'If a tool call fails, inspect the error, fix the arguments, and try again.',
      'Never invent data or claim success without a successful tool result.',
      'If you need information the user has not provided, ask them.',
    ];
    if (context.pendingMutations?.length) {
      lines.push(
        'The user has approved these pending actions; call the tool to complete them: ' +
          context.pendingMutations
            .map((p) => `${p.function.name}(${p.function.arguments})`)
            .join(', '),
      );
    }
    return {
      role: 'system',
      content: lines.join('\n'),
    };
  }
}
