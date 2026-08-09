import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { UserEntity } from '@/auth/user.entity';
import { TenantEntity } from '@/tenants/tenant.entity';
import { hashPassword } from '@/auth/password';

describe('AuthService', () => {
  let service: AuthService;
  const users = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const tenants = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const jwt = { signAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('token-1');

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: users },
        { provide: getRepositoryToken(TenantEntity), useValue: tenants },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('signs up a new company and user', async () => {
    users.findOne.mockResolvedValue(null);
    tenants.create.mockReturnValue({ name: 'Acme' });
    tenants.save.mockImplementation(async (t) => ({ id: 'tenant-1', ...t }));
    users.create.mockImplementation((dto: Record<string, unknown>) => ({ ...dto }));
    users.save.mockImplementation(async (u) => ({ id: 'user-1', ...u }));

    const result = await service.signup({
      companyName: 'Acme',
      email: 'A@B.com',
      password: 'password123',
    });

    expect(tenants.save).toHaveBeenCalledWith({ name: 'Acme' });
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@b.com',
        tenantId: 'tenant-1',
      }),
    );
    expect(result.token).toBe('token-1');
    expect(result.user).toEqual({ id: 'user-1', email: 'a@b.com' });
    expect(result.tenant).toEqual({ id: 'tenant-1', name: 'Acme' });
  });

  it('rejects a duplicate email on signup', async () => {
    users.findOne.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    await expect(
      service.signup({
        companyName: 'Acme',
        email: 'a@b.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
    expect(tenants.save).not.toHaveBeenCalled();
  });

  it('logs in with a valid password', async () => {
    const passwordHash = await hashPassword('password123');
    users.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      passwordHash,
      tenant: { id: 'tenant-1', name: 'Acme' },
    });

    const result = await service.login({
      email: 'a@b.com',
      password: 'password123',
    });

    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(result.user.id).toBe('user-1');
    expect(result.tenant.name).toBe('Acme');
  });

  it('rejects a wrong password', async () => {
    const passwordHash = await hashPassword('password123');
    users.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      passwordHash,
      tenant: { id: 'tenant-1', name: 'Acme' },
    });

    await expect(
      service.login({ email: 'a@b.com', password: 'nope-nope' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown email', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ghost@b.com', password: 'whatever1' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the current user via me', async () => {
    users.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      tenant: { id: 'tenant-1', name: 'Acme' },
    });

    const result = await service.me('user-1');

    expect(result.user.id).toBe('user-1');
    expect(result.tenant.name).toBe('Acme');
  });
});
