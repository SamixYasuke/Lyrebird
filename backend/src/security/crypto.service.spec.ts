import { ConfigService } from '@nestjs/config';
import { CryptoService } from '@/security/crypto.service';

function makeCrypto(): CryptoService {
  const config = { get: jest.fn((key: string) => (key === 'DATA_ENCRYPTION_KEY' ? 'test-secret' : undefined)) } as unknown as ConfigService;
  return new CryptoService(config);
}

describe('CryptoService', () => {
  it('throws when DATA_ENCRYPTION_KEY is missing', () => {
    const config = { get: jest.fn(() => undefined) } as unknown as ConfigService;
    expect(() => new CryptoService(config)).toThrow('DATA_ENCRYPTION_KEY');
  });

  it('round-trips a value through encrypt/decrypt', () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encrypt('Bearer sup3r-secret');
    expect(encrypted).not.toContain('sup3r-secret');
    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(crypto.decrypt(encrypted)).toBe('Bearer sup3r-secret');
    expect(crypto.isEncrypted(encrypted)).toBe(true);
  });

  it('produces different ciphertext for the same input (random IV)', () => {
    const crypto = makeCrypto();
    const a = crypto.encrypt('same input');
    const b = crypto.encrypt('same input');
    expect(a).not.toBe(b);
    expect(crypto.decrypt(a)).toBe('same input');
    expect(crypto.decrypt(b)).toBe('same input');
  });

  it('passes legacy plaintext through decrypt unchanged', () => {
    const crypto = makeCrypto();
    expect(crypto.decrypt('123456:ABC-def_GH')).toBe('123456:ABC-def_GH');
    expect(crypto.decrypt(null)).toBeNull();
    expect(crypto.isEncrypted('plain')).toBe(false);
    expect(crypto.isEncrypted(null)).toBe(false);
  });

  it('throws on a tampered ciphertext (GCM auth tag)', () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encrypt('payload');
    const tampered = `${encrypted.slice(0, -2)}xx`;
    expect(() => crypto.decrypt(tampered)).toThrow();
  });

  it('hashes bot tokens deterministically', () => {
    const crypto = makeCrypto();
    const hash = crypto.hashBotToken('123456:ABC-def_GH');
    expect(hash).toBe(crypto.hashBotToken('123456:ABC-def_GH'));
    expect(hash).not.toBe(crypto.hashBotToken('different-token'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
