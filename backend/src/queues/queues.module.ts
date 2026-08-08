import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { buildRedisConnection } from '@/redis/redis-config';

export const TELEGRAM_UPDATES_QUEUE = 'telegram-updates';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: buildRedisConnection(config),
      }),
    }),
    BullModule.registerQueue({
      name: TELEGRAM_UPDATES_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
