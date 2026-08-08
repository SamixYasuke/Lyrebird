import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  openapiSpec?: string;

  @IsOptional()
  @IsString()
  authHeaderName?: string;

  @IsOptional()
  @IsString()
  authHeaderValue?: string;
}
