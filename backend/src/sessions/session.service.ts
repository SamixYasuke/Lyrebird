import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '@/redis/redis.module';
import type { RedisClient } from '@/redis/redis.module';
import { LlmService } from '@/agents/llm.service';
import type { ChatMessage, ToolCall } from '@/agents/agent.types';

const SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_HISTORY_MESSAGES = 40;
const DEFAULT_TOKEN_BUDGET = 3000;
const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

export interface PendingConfirmation {
  toolCall: ToolCall;
  summary?: string;
  askCount?: number;
}

export interface SessionState {
  summary: string | null;
  history: ChatMessage[];
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  private key(serviceId: string, chatId: number): string {
    return `session:${serviceId}:${chatId}`;
  }

  private confirmationKey(serviceId: string, chatId: number): string {
    return `session:confirm:${serviceId}:${chatId}`;
  }

  async getSession(serviceId: string, chatId: number): Promise<SessionState> {
    const raw = await this.redis.get(this.key(serviceId, chatId));
    if (!raw) return { summary: null, history: [] };
    try {
      const parsed = JSON.parse(raw) as Partial<SessionState>;
      return {
        summary: parsed.summary ?? null,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch {
      return { summary: null, history: [] };
    }
  }

  async append(
    serviceId: string,
    chatId: number,
    ...messages: ChatMessage[]
  ): Promise<void> {
    const state = await this.getSession(serviceId, chatId);
    let summary = state.summary;
    let history = [...state.history, ...messages];

    if (this.estimateTokens(summary, history) > this.tokenBudget()) {
      const cut = Math.max(1, Math.ceil(history.length / 2));
      const oldest = history.slice(0, cut);
      history = history.slice(cut);
      try {
        summary = await this.summarize(summary, oldest);
      } catch {
        // keep the previous summary; the oldest messages are still dropped
      }
      while (
        this.estimateTokens(summary, history) > this.tokenBudget() &&
        history.length > 1
      ) {
        history.shift();
      }
    }

    const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
    await this.redis.set(
      this.key(serviceId, chatId),
      JSON.stringify({ summary, history: trimmed }),
      'EX',
      SESSION_TTL_SECONDS,
    );
  }

  async getPendingConfirmation(
    serviceId: string,
    chatId: number,
  ): Promise<PendingConfirmation | null> {
    const raw = await this.redis.get(this.confirmationKey(serviceId, chatId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingConfirmation;
    } catch {
      return null;
    }
  }

  async setPendingConfirmation(
    serviceId: string,
    chatId: number,
    pending: PendingConfirmation | null,
  ): Promise<void> {
    const key = this.confirmationKey(serviceId, chatId);
    if (!pending) {
      await this.redis.del(key);
      return;
    }
    await this.redis.set(
      key,
      JSON.stringify(pending),
      'EX',
      SESSION_TTL_SECONDS,
    );
  }

  private tokenBudget(): number {
    return (
      this.config.get<number>('SESSION_TOKEN_BUDGET') ?? DEFAULT_TOKEN_BUDGET
    );
  }

  private estimateTokens(
    summary: string | null,
    history: ChatMessage[],
  ): number {
    const summaryChars = summary ? summary.length : 0;
    const historyChars = history.reduce((acc, m) => {
      const args =
        m.tool_calls?.map((t) => t.function.arguments).join('') ?? '';
      return acc + (m.content?.length ?? 0) + args.length;
    }, 0);
    return Math.ceil((summaryChars + historyChars) / 4);
  }

  private async summarize(
    existing: string | null,
    messages: ChatMessage[],
  ): Promise<string> {
    const model = this.config.get<string>('OPENROUTER_MODEL') ?? DEFAULT_MODEL;
    const context: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content:
        m.role === 'tool' && m.tool_call_id
          ? `[result of ${m.tool_call_id}] ${m.content}`
          : m.content,
    }));
    const prompt: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are summarizing a customer-support conversation for a Telegram bot. ' +
          'Produce a concise summary (max 150 words) covering what the user asked, what was done, ' +
          'and any pending decisions. Preserve important facts such as account numbers and order ids.',
      },
      ...(existing
        ? [
            {
              role: 'system' as const,
              content: `Previous summary:\n${existing}`,
            },
          ]
        : []),
      ...context,
    ];
    const response = await this.llm.chat(model, prompt, []);
    const content = response.content?.trim();
    if (!content) throw new Error('Empty summary from LLM');
    return content;
  }
}
