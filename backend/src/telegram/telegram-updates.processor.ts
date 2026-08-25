import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { TELEGRAM_UPDATES_QUEUE } from '@/queues/queues.module';
import { ServiceEntity } from '@/tenants/service.entity';
import {
  AgentLoopService,
  AgentResult,
} from '@/agents/agent-loop.service';
import { LlmService } from '@/agents/llm.service';
import { ToolProviderService } from '@/agents/tool-provider.service';
import type { AgentTool } from '@/agents/agent-tool';
import { CryptoService } from '@/security/crypto.service';
import {
  PendingConfirmation,
  SessionService,
} from '@/sessions/session.service';
import { TelegramApiService } from '@/telegram/telegram-api.service';
import type { ChatMessage, ToolCall } from '@/agents/agent.types';
import type { TelegramUpdatesJob } from '@/telegram/telegram.types';

const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

const CONFIRM_PHRASES = new Set([
  'yes',
  'y',
  'yeah',
  'yea',
  'yep',
  'yup',
  'sure',
  'ok',
  'okay',
  'kk',
  'confirm',
  'proceed',
  'go ahead',
  'go for it',
  'do it',
  'do that',
  'yes please',
  'yes do it',
  'okay sure',
  'sure go ahead',
  'alright',
  'alright then',
  'fine',
  'fine do it',
]);

const DECLINE_PHRASES = new Set([
  'no',
  'n',
  'nope',
  'nah',
  'cancel',
  'cancel it',
  'cancel that',
  'stop',
  'abort',
  "don't",
  'dont',
  'no thanks',
  'no thank you',
  'never mind',
  'forget it',
  'not now',
  'not today',
]);

const MAX_CONFIRM_ASKS = 3;

const TYPOGRAPHIC_DASHES = /[\u00ad\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g;

function normalizeText(text: string): string {
  return text.replace(TYPOGRAPHIC_DASHES, '-');
}

const DECLINE_NOTE =
  'The user declined the pending action. Do NOT call any mutation tools. Acknowledge the cancellation and offer alternatives.';

type ConfirmIntent = 'confirm' | 'decline' | 'unclear';

@Processor(TELEGRAM_UPDATES_QUEUE)
export class TelegramUpdatesProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramUpdatesProcessor.name);

  constructor(
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
    private readonly tools: ToolProviderService,
    private readonly sessions: SessionService,
    private readonly agent: AgentLoopService,
    private readonly telegram: TelegramApiService,
    private readonly llm: LlmService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
  ) {
    super();
  }

  async process(job: Job<TelegramUpdatesJob>): Promise<void> {
    const { serviceId, update } = job.data;
    const message = update.message;
    if (!message?.text || !message.chat) return;

    const text = normalizeText(message.text);
    this.logger.log(`[PIPELINE] Job received: service=${serviceId} chat=${message.chat.id} text="${text.slice(0, 80)}"`);

    const service = await this.services.findOne({ where: { id: serviceId } });
    if (!service) {
      this.logger.warn(`[PIPELINE] Service ${serviceId} not found`);
      return;
    }
    this.logger.log(`[PIPELINE] Service found: baseUrl=${service.baseUrl}`);

    const chatId = message.chat.id;
    const botToken = this.crypto.decrypt(service.botToken) ?? '';
    if (!botToken) {
      this.logger.error(`[PIPELINE] Failed to decrypt bot token for service ${serviceId}`);
      return;
    }
    this.logger.log(`[PIPELINE] Bot token decrypted, starting typing indicator`);
    const typing = this.startTyping(botToken, chatId);
    try {
      const spec = this.crypto.decrypt(service.openapiSpec) ?? '';
      this.logger.log(`[PIPELINE] Spec length: ${spec.length} chars`);
      const tools = await this.tools.getTools(serviceId, spec);
      this.logger.log(`[PIPELINE] Tools loaded: ${tools.length} tools`);
      await this.runPipeline(service, tools, text, chatId, botToken);
      this.logger.log(`[PIPELINE] Pipeline completed successfully`);
    } catch (err) {
      this.logger.error(
        `[PIPELINE] FAILED for service ${serviceId} chat ${chatId}: ${
          err instanceof Error ? (err.stack ?? err.message) : String(err)
        }`,
      );
      try {
        await this.telegram.sendMessage(
          botToken,
          chatId,
          "Something went wrong on my end while handling that. Please try again in a moment.",
        );
      } catch (sendErr) {
        this.logger.error(`[PIPELINE] Even fallback message failed: ${sendErr instanceof Error ? sendErr.message : String(sendErr)}`);
      }
    } finally {
      clearInterval(typing);
    }
  }

  private startTyping(botToken: string, chatId: number): NodeJS.Timeout {
    void this.telegram.sendChatAction(botToken, chatId);
    return setInterval(() => {
      void this.telegram.sendChatAction(botToken, chatId);
    }, 4000);
  }

  private async runPipeline(
    service: ServiceEntity,
    tools: AgentTool[],
    text: string,
    chatId: number,
    botToken: string,
  ): Promise<void> {
    this.logger.log(`[PIPELINE] Loading session for service ${service.id} chat ${chatId}`);
    const state = await this.sessions.getSession(service.id, chatId);
    this.logger.log(`[PIPELINE] Session loaded: ${state.history.length} history msgs, summary=${!!state.summary}`);
    const userMessage = { role: 'user' as const, content: text };

    const pending = await this.sessions.getPendingConfirmation(
      service.id,
      chatId,
    );
    this.logger.log(`[PIPELINE] Pending confirmation: ${pending ? pending.toolCall.function.name : 'none'}`);
    const runMessages: ChatMessage[] = [
      ...(state.summary
        ? [
            {
              role: 'system' as const,
              content: `Conversation summary so far:\n${state.summary}`,
            },
          ]
        : []),
      ...state.history,
      userMessage,
    ];
    const context = {
      baseUrl: service.baseUrl,
      authHeaderName: service.authHeaderName,
      authHeaderValue: this.crypto.decrypt(service.authHeaderValue),
      tools,
      model:
        this.config.get<string>('OPENROUTER_MODEL') ??
        'nvidia/nemotron-3-nano-30b-a3b:free',
      fallbackModel: this.config.get<string>('OPENROUTER_FALLBACK_MODEL'),
    };
    this.logger.log(`[PIPELINE] Context: model=${context.model} fallback=${context.fallbackModel} baseUrl=${context.baseUrl}`);

    let pendingMutations: ToolCall[] | undefined;
    let keptPending: PendingConfirmation | null = null;
    let directReply: string | null = null;

    if (pending) {
      const intent = await this.decideConfirmIntent(pending, text);
      if (intent === 'confirm') {
        pendingMutations = [pending.toolCall];
      } else if (intent === 'decline') {
        runMessages.push({ role: 'system', content: DECLINE_NOTE });
      } else {
        const asked = pending.askCount ?? 0;
        if (asked >= MAX_CONFIRM_ASKS - 1) {
          directReply =
            "I didn't get a clear yes or no, so I've set that aside. " +
            'Just tell me to go ahead and I will redo it.';
        } else {
          keptPending = { ...pending, askCount: asked + 1 };
          runMessages.push({
            role: 'system',
            content:
              `The user has neither confirmed nor declined the pending action ` +
              `(${pending.toolCall.function.name}). Answer whatever they are ` +
              `asking about normally. Do NOT execute that action and do NOT ask ` +
              `about it again.`,
          });
        }
      }
    }

    this.logger.log(`[PIPELINE] Calling agent loop (${runMessages.length} messages)...`);
    let result: AgentResult;
    if (directReply) {
      result = {
        reply: directReply,
        iterations: 0,
        usedFallback: false,
        toolCalls: [],
      };
    } else {
      result = await this.agent.run(
        pendingMutations ? { ...context, pendingMutations } : context,
        runMessages,
      );
    }
    this.logger.log(`[PIPELINE] Agent returned: reply=${result.reply.length} chars, iterations=${result.iterations}, fallback=${result.usedFallback}, pending=${!!result.pendingToolCall}`);

    if (result.pendingToolCall) {
      await this.sessions.setPendingConfirmation(service.id, chatId, {
        toolCall: result.pendingToolCall,
        summary: result.confirmationSummary,
        askCount: 0,
      });
    } else if (keptPending) {
      await this.sessions.setPendingConfirmation(service.id, chatId, keptPending);
    } else {
      await this.sessions.setPendingConfirmation(service.id, chatId, null);
    }

    this.logger.log(`[PIPELINE] Appending to session history`);
    await this.sessions.append(service.id, chatId, userMessage, {
      role: 'assistant',
      content: result.reply,
    });

    this.logger.log(`[PIPELINE] Sending reply to chat ${chatId} (${result.reply.length} chars)`);
    const sent = await this.telegram.sendMessage(botToken, chatId, result.reply);
    this.logger.log(`[PIPELINE] sendMessage returned: ${sent}`);
  }

  private async decideConfirmIntent(
    pending: PendingConfirmation,
    text: string,
  ): Promise<ConfirmIntent> {
    const fastPath = this.confirmIntentFastPath(text);
    if (fastPath !== 'unclear') return fastPath;
    return this.confirmIntentViaLlm(pending, text);
  }

  private confirmIntentFastPath(text: string): ConfirmIntent {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (CONFIRM_PHRASES.has(normalized)) return 'confirm';
    if (DECLINE_PHRASES.has(normalized)) return 'decline';
    return 'unclear';
  }

  private async confirmIntentViaLlm(
    pending: PendingConfirmation,
    text: string,
  ): Promise<ConfirmIntent> {
    const model =
      this.config.get<string>('OPENROUTER_MODEL') ?? DEFAULT_MODEL;
    try {
      const response = await this.llm.chat(
        model,
        [
          {
            role: 'system',
            content:
              'A Telegram bot asked a customer to confirm a pending action and ' +
              'the customer replied. Decide whether the customer approved it.\n' +
              'Reply with EXACTLY one word: CONFIRM, DECLINE, or UNCLEAR.\n' +
              '- CONFIRM: approval, including hedged approvals such as ' +
              '"no it\'s fine, go ahead", "yeah sure", "ok do it", "alright then".\n' +
              '- DECLINE: a clear refusal such as "no", "don\'t", "cancel that", "nah".\n' +
              '- UNCLEAR: a question, a restatement, or anything that is not a ' +
              'clear approval or refusal.',
          },
          {
            role: 'user',
            content: `Pending action: ${
              pending.summary || pending.toolCall.function.name
            }\nUser reply: "${text}"`,
          },
        ],
        [],
      );
      const word = response.content?.trim().toUpperCase();
      if (word?.startsWith('CONFIRM')) return 'confirm';
      if (word?.startsWith('DECLINE')) return 'decline';
      return 'unclear';
    } catch {
      return 'unclear';
    }
  }
}
