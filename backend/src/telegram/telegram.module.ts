import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '@/agents/agents.module';
import { QueuesModule } from '@/queues/queues.module';
import { SessionsModule } from '@/sessions/sessions.module';
import { SecurityModule } from '@/security/security.module';
import { ServiceEntity } from '@/tenants/service.entity';
import { TelegramApiService } from '@/telegram/telegram-api.service';
import { TelegramController } from '@/telegram/telegram.controller';
import { TelegramService } from '@/telegram/telegram.service';
import { TelegramUpdatesProcessor } from '@/telegram/telegram-updates.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceEntity]),
    QueuesModule,
    AgentsModule,
    SessionsModule,
    SecurityModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramApiService, TelegramUpdatesProcessor],
  exports: [TelegramApiService],
})
export class TelegramModule {}
