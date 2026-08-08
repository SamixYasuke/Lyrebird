import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION_PREFIX = 'v1:';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret = config.get<string>('DATA_ENCRYPTION_KEY');
    if (!secret) {
      throw new Error(
        'DATA_ENCRYPTION_KEY is required to encrypt tenant credentials at rest',
      );
    }
    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      VERSION_PREFIX,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  decrypt(payload: string | null): string | null {
    if (!payload || !payload.startsWith(VERSION_PREFIX)) return payload;
    const [, ivB64, tagB64, dataB64] = payload.split('.');
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  isEncrypted(payload: string | null): boolean {
    return Boolean(payload && payload.startsWith(VERSION_PREFIX));
  }

  hashBotToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
