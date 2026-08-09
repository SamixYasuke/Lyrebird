import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { UserEntity } from '@/auth/user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const jwt = { verifyAsync: jest.fn() };
  const users = { findOne: jest.fn() };

  const contextFor = (authorization?: string) => {
    const request: { headers: { authorization?: string }; user?: UserEntity } = {
      headers: { authorization },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwt },
        { provide: getRepositoryToken(UserEntity), useValue: users },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  it('attaches the user for a valid token', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    const user = { id: 'user-1', email: 'a@b.com' } as UserEntity;
    users.findOne.mockResolvedValue(user);
    const { request, ...context } = contextFor('Bearer abc');

    await expect(
      guard.canActivate(context as never),
    ).resolves.toBe(true);
    expect(request.user).toBe(user);
    expect(users.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        relations: { tenant: true },
      }),
    );
  });

  it('rejects a missing token', async () => {
    const { request, ...context } = contextFor();
    await expect(guard.canActivate(context as never)).rejects.toThrow();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  it('rejects a non-bearer scheme', async () => {
    const { ...context } = contextFor('Basic abc');
    await expect(guard.canActivate(context as never)).rejects.toThrow();
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'));
    const { ...context } = contextFor('Bearer bad');
    await expect(guard.canActivate(context as never)).rejects.toThrow();
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('rejects a token for a deleted user', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    users.findOne.mockResolvedValue(null);
    const { ...context } = contextFor('Bearer abc');
    await expect(guard.canActivate(context as never)).rejects.toThrow();
  });
});
