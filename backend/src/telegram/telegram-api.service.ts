import { Injectable, Logger } from '@nestjs/common';
import { markdownToTelegramHtml } from '@/telegram/markdown';

interface TelegramApiResult {
  ok: boolean;
  result?: { username?: string; [key: string]: unknown };
}

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);

  async sendChatAction(
    botToken: string,
    chatId: number,
    action: 'typing' | 'upload_photo' | 'record_video' | 'find_location' = 'typing',
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendChatAction`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action }),
        },
      );
      const data = (await response.json()) as TelegramApiResult;
      return response.ok && data.ok;
    } catch {
      this.logger.error('Telegram sendChatAction network error');
      return false;
    }
  }

  async sendMessage(
    botToken: string,
    chatId: number,
    text: string,
  ): Promise<boolean> {
    const html = markdownToTelegramHtml(text);
    this.logger.log(`[TG] sendMessage to chat ${chatId}: input=${text.length} chars, html=${html.length} chars`);
    const payload = {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
    };
    try {
      let response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok && response.status === 400) {
        this.logger.warn(
          `[TG] Telegram rejected HTML for chat ${chatId}, retrying as plain text`,
        );
        response = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
          },
        );
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '<unreadable>');
        this.logger.warn(
          `[TG] sendMessage FAILED: status=${response.status} chat=${chatId} body=${body.slice(0, 300)}`,
        );
        return false;
      }
      this.logger.log(`[TG] sendMessage OK: chat=${chatId}`);
      return true;
    } catch (err) {
      this.logger.error(`[TG] sendMessage network error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async getMe(botToken: string): Promise<{ ok: boolean; username?: string }> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
      );
      const data = (await response.json()) as TelegramApiResult;
      if (!response.ok || !data.ok) {
        this.logger.warn(`Telegram getMe failed for bot token`);
        return { ok: false };
      }
      return { ok: true, username: data.result?.username };
    } catch {
      this.logger.error('Telegram getMe network error');
      return { ok: false };
    }
  }

  async setWebhook(botToken: string, url: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        },
      );
      const data = (await response.json()) as TelegramApiResult;
      if (!response.ok || !data.ok) {
        this.logger.warn(`Telegram setWebhook failed for ${url}`);
        return false;
      }
      return true;
    } catch {
      this.logger.error('Telegram setWebhook network error');
      return false;
    }
  }
}
