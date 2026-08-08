import { ConfigService } from '@nestjs/config';
import { buildRedisConnection } from '@/redis/redis-config';

function makeConfig(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      if (values[key] === undefined) throw new Error(`${key} not set`);
      return values[key];
    }),
  } as unknown as ConfigService;
}

describe('buildRedisConnection', () => {
  it('uses REDIS_HOST/REDIS_PORT when no URL is given', () => {
    const config = makeConfig({ REDIS_HOST: 'localhost', REDIS_PORT: 6379 });
    expect(buildRedisConnection(config)).toEqual({
      host: 'localhost',
      port: 6379,
    });
  });

  it('parses a plain redis:// URL', () => {
    const config = makeConfig({
      REDIS_URL: 'redis://myhost.example.com:6380',
    });
    expect(buildRedisConnection(config)).toEqual({
      host: 'myhost.example.com',
      port: 6380,
      username: undefined,
      password: undefined,
      tls: undefined,
    });
  });

  it('parses a TLS rediss:// URL with credentials (Upstash)', () => {
    const config = makeConfig({
      REDIS_URL: 'rediss://default:s3cr3t@lyrebird-abc.upstash.io:6379',
    });
    expect(buildRedisConnection(config)).toEqual({
      host: 'lyrebird-abc.upstash.io',
      port: 6379,
      username: 'default',
      password: 's3cr3t',
      tls: {},
    });
  });

  it('defaults the port to 6379 when the URL omits it', () => {
    const config = makeConfig({ REDIS_URL: 'rediss://host.example.com' });
    expect(buildRedisConnection(config).port).toBe(6379);
    expect(buildRedisConnection(config).tls).toEqual({});
  });

  it('throws when neither URL nor host is configured', () => {
    const config = makeConfig({});
    expect(() => buildRedisConnection(config)).toThrow('REDIS_HOST not set');
  });
});
