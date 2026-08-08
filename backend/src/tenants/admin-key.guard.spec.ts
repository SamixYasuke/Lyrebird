import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AdminKeyGuard } from '@/tenants/admin-key.guard';

describe('AdminKeyGuard', () => {
  let guard: AdminKeyGuard;
  const config = { get: jest.fn() };

  const makeContext = (header?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) =>
            name === 'x-admin-key' ? header : undefined,
        }),
      }),
    }) as never;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [AdminKeyGuard, { provide: ConfigService, useValue: config }],
    }).compile();
    guard = module.get(AdminKeyGuard);
  });

  it('allows all requests when ADMIN_API_KEY is not configured', () => {
    config.get.mockReturnValue(undefined);

    expect(guard.canActivate(makeContext(undefined))).toBe(true);
    expect(guard.canActivate(makeContext('anything'))).toBe(true);
  });

  it('allows a request with the matching admin key', () => {
    config.get.mockReturnValue('s3cret');

    expect(guard.canActivate(makeContext('s3cret'))).toBe(true);
  });

  it('blocks a request with a wrong or missing admin key', () => {
    config.get.mockReturnValue('s3cret');

    expect(guard.canActivate(makeContext('wrong'))).toBe(false);
    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });
});
