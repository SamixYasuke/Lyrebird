import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { TelegramService } from '@/telegram/telegram.service';
import type { TelegramUpdate } from '@/telegram/telegram.types';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegram: TelegramService) {}

  @Post('webhook/:botToken')
  @HttpCode(200)
  async webhook(
    @Param('botToken') botToken: string,
    @Body() update: TelegramUpdate,
  ): Promise<{ ok: boolean }> {
    try {
      await this.telegram.handleUpdate(botToken, update);
    } catch (err) {
      this.logger.error(
        `Failed to handle update: ${err instanceof Error ? err.message : err}`,
      );
    }
    return { ok: true };
  }
}
