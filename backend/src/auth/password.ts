import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `${PREFIX}:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [prefix, salt, hex] = stored.split(':');
  if (prefix !== PREFIX || !salt || !hex) return false;
  try {
    const key = await derive(password, salt);
    const expected = Buffer.from(hex, 'hex');
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
