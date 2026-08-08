import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const base = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
          ...(config.get<string>('DB_SSL') === 'true'
            ? { ssl: { rejectUnauthorized: false } }
            : {}),
        };
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return { ...base, url: databaseUrl };
        }
        return {
          ...base,
          host: config.getOrThrow<string>('DB_HOST'),
          port: config.getOrThrow<number>('DB_PORT'),
          username: config.getOrThrow<string>('DB_USER'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.getOrThrow<string>('DB_NAME'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
