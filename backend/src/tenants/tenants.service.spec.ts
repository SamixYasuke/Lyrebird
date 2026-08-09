import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TenantsService } from '@/tenants/tenants.service';
import { TenantEntity } from '@/tenants/tenant.entity';
import { ServiceEntity } from '@/tenants/service.entity';
import { UserEntity } from '@/auth/user.entity';
import { CryptoService } from '@/security/crypto.service';
import { OpenApiParserService } from '@/agents/openapi-parser.service';
import { ToolProviderService } from '@/agents/tool-provider.service';
import { TelegramApiService } from '@/telegram/telegram-api.service';

describe('TenantsService', () => {
  let service: TenantsService;
  const tenantsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const servicesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const usersRepo = {
    findOne: jest.fn(),
  };
  const parser = { parse: jest.fn() };
  const tools = { invalidate: jest.fn() };
  const telegram = { getMe: jest.fn(), setWebhook: jest.fn() };
  const config = { get: jest.fn() };
  const crypto = {
    encrypt: jest.fn((value: string) => `enc:${value}`),
    decrypt: jest.fn((value: string | null) =>
      value?.startsWith('enc:') ? value.slice(4) : value,
    ),
    hashBotToken: jest.fn((value: string) => `hash:${value}`),
    isEncrypted: jest.fn((value: string | null) =>
      Boolean(value?.startsWith('enc:')),
    ),
  };

  const user = { id: 'user-1', tenantId: 'tenant-1' } as UserEntity;
  const tenant = { id: 'tenant-1', name: 'Acme' } as TenantEntity;

  const serviceDto = {
    name: 'Orders API',
    baseUrl: 'https://api.example.com',
    openapiSpec: 'openapi: 3.0.0',
    botToken: '123456:ABC-def_GH',
    authHeaderName: 'X-Api-Key',
    authHeaderValue: 'secret',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    usersRepo.findOne.mockResolvedValue(user);
    tenantsRepo.findOne.mockResolvedValue(tenant);
    parser.parse.mockResolvedValue([{ function: { name: 'getOrder' } }]);
    telegram.getMe.mockResolvedValue({ ok: true, username: 'shop_bot' });
    telegram.setWebhook.mockResolvedValue(true);
    config.get.mockImplementation((key: string) =>
      key === 'PUBLIC_BASE_URL' ? 'https://public.example.com' : undefined,
    );

    const module = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(TenantEntity), useValue: tenantsRepo },
        { provide: getRepositoryToken(ServiceEntity), useValue: servicesRepo },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepo },
        { provide: OpenApiParserService, useValue: parser },
        { provide: ToolProviderService, useValue: tools },
        { provide: TelegramApiService, useValue: telegram },
        { provide: ConfigService, useValue: config },
        { provide: CryptoService, useValue: crypto },
      ],
    }).compile();

    service = module.get(TenantsService);
  });

  it('lists only the current user\u2019s tenant', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      tenant: { id: 'tenant-1', name: 'Acme', services: [] },
    });

    const result = await service.listTenants('user-1');

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        relations: { tenant: { services: true } },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tenant-1');
  });

  it('registers a service: validates spec + bot, sets webhook, saves', async () => {
    servicesRepo.create.mockImplementation((dto) => ({ id: 'svc-1', ...dto }));
    servicesRepo.save.mockImplementation(async (s) => s);

    const result = await service.createService('user-1', 'tenant-1', serviceDto);

    expect(parser.parse).toHaveBeenCalledWith('openapi: 3.0.0');
    expect(telegram.getMe).toHaveBeenCalledWith('123456:ABC-def_GH');
    expect(telegram.setWebhook).toHaveBeenCalledWith(
      '123456:ABC-def_GH',
      'https://public.example.com/telegram/webhook/123456:ABC-def_GH',
    );
    expect(servicesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Orders API',
        baseUrl: 'https://api.example.com',
        openapiSpec: 'enc:openapi: 3.0.0',
        botToken: 'enc:123456:ABC-def_GH',
        botTokenHash: 'hash:123456:ABC-def_GH',
        authHeaderName: 'X-Api-Key',
        authHeaderValue: 'enc:secret',
      }),
    );
    expect(result.id).toBe('svc-1');
    expect(result.botToken).toBe('123456:ABC-def_GH');
    expect(result.openapiSpec).toBe('openapi: 3.0.0');
    expect(result.authHeaderValue).toBeNull();
  });

  it('rejects an invalid OpenAPI spec before touching Telegram', async () => {
    parser.parse.mockRejectedValue(new Error('missing "paths"'));

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(BadRequestException);
    expect(telegram.getMe).not.toHaveBeenCalled();
    expect(servicesRepo.save).not.toHaveBeenCalled();
  });

  it('rejects an invalid bot token', async () => {
    telegram.getMe.mockResolvedValue({ ok: false });

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(BadRequestException);
    expect(telegram.setWebhook).not.toHaveBeenCalled();
    expect(servicesRepo.save).not.toHaveBeenCalled();
  });

  it('rejects when PUBLIC_BASE_URL is not configured', async () => {
    config.get.mockReturnValue(undefined);

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(BadRequestException);
    expect(telegram.setWebhook).not.toHaveBeenCalled();
    expect(servicesRepo.save).not.toHaveBeenCalled();
  });

  it('rejects when the webhook cannot be registered', async () => {
    telegram.setWebhook.mockResolvedValue(false);

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(BadRequestException);
    expect(servicesRepo.save).not.toHaveBeenCalled();
  });

  it('rejects when the tenant does not belong to the user', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      tenantId: 'someone-elses-tenant',
    });

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(NotFoundException);
    expect(parser.parse).not.toHaveBeenCalled();
    expect(telegram.getMe).not.toHaveBeenCalled();
  });

  it('reports a duplicate bot token as a conflict', async () => {
    servicesRepo.create.mockImplementation((dto) => ({ id: 'svc-1', ...dto }));
    servicesRepo.save.mockRejectedValue(new Error('duplicate key'));

    await expect(
      service.createService('user-1', 'tenant-1', serviceDto),
    ).rejects.toThrow(ConflictException);
  });

  it('lists services for a tenant, decrypting and masking secrets', async () => {
    servicesRepo.find.mockResolvedValue([
      {
        id: 'svc-1',
        openapiSpec: 'enc:openapi: 3.0.0',
        botToken: 'enc:123:ABC',
        botTokenHash: 'hash:123:ABC',
        authHeaderValue: 'enc:secret',
      },
    ]);

    await expect(
      service.listServices('user-1', 'tenant-1'),
    ).resolves.toEqual([
      {
        id: 'svc-1',
        openapiSpec: 'openapi: 3.0.0',
        botToken: '123:ABC',
        botTokenHash: 'hash:123:ABC',
        authHeaderValue: null,
      },
    ]);
    expect(servicesRepo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
  });

  it('updates editable service fields and busts the tools cache', async () => {
    const row = {
      id: 'svc-1',
      name: 'Old name',
      baseUrl: 'https://old.example.com',
      openapiSpec: 'openapi: 3.0.0',
      authHeaderName: 'X-Api-Key',
      authHeaderValue: 'secret',
    } as ServiceEntity;
    servicesRepo.findOne.mockResolvedValue(row);
    servicesRepo.save.mockImplementation(async (s) => s);

    const result = await service.updateService('user-1', 'tenant-1', 'svc-1', {
      name: 'New name',
      baseUrl: 'https://new.example.com',
      authHeaderValue: 'fresh-secret',
    });

    expect(servicesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New name',
        baseUrl: 'https://new.example.com',
        authHeaderValue: 'enc:fresh-secret',
      }),
    );
    expect(tools.invalidate).toHaveBeenCalledWith('svc-1');
    expect(result.authHeaderValue).toBeNull();
  });

  it('validates the spec before updating it', async () => {
    servicesRepo.findOne.mockResolvedValue({ id: 'svc-1' } as ServiceEntity);
    parser.parse.mockRejectedValue(new Error('missing "paths"'));

    await expect(
      service.updateService('user-1', 'tenant-1', 'svc-1', {
        openapiSpec: 'openapi: 3.0.0',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(servicesRepo.save).not.toHaveBeenCalled();
    expect(tools.invalidate).not.toHaveBeenCalled();
  });

  it('throws when updating a service that does not exist', async () => {
    servicesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateService('user-1', 'tenant-1', 'missing', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when deleting a service that does not exist', async () => {
    servicesRepo.delete.mockResolvedValue({ affected: 0 });

    await expect(
      service.deleteService('user-1', 'tenant-1', 'missing'),
    ).rejects.toThrow(NotFoundException);
  });
});
