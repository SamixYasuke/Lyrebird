import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class RegisterMockDto {
  @IsString()
  @Matches(/^\d{6,}:[A-Za-z0-9_-]+$/, {
    message: 'botToken must look like a Telegram bot token (digits:token)',
  })
  botToken: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  authHeaderName?: string;

  @IsOptional()
  @IsString()
  authHeaderValue?: string;
}
