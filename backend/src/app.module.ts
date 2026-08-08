import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '@/config/env.validation';
import { DatabaseModule } from '@/database/database.module';
import { RedisModule } from '@/redis/redis.module';
import { QueuesModule } from '@/queues/queues.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { AgentsModule } from '@/agents/agents.module';
import { SessionsModule } from '@/sessions/sessions.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { MockModule } from '@/mock/mock.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    RedisModule,
    QueuesModule,
    TenantsModule,
    AgentsModule,
    SessionsModule,
    TelegramModule,
    MockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
