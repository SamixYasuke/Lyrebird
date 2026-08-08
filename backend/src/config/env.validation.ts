import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

export class EnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsOptional()
  @IsString()
  OPENROUTER_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENROUTER_MODEL?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  OPENROUTER_FALLBACK_MODEL?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  ADMIN_API_KEY?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  SESSION_TOKEN_BUDGET?: number;

  @IsString()
  @IsNotEmpty()
  DATA_ENCRYPTION_KEY: string;
}
