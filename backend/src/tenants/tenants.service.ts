import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenApiParserService } from '@/agents/openapi-parser.service';
import { ToolProviderService } from '@/agents/tool-provider.service';
import { TelegramApiService } from '@/telegram/telegram-api.service';
import { CryptoService } from '@/security/crypto.service';
import { UserEntity } from '@/auth/user.entity';
import { ServiceEntity } from '@/tenants/service.entity';
import { TenantEntity } from '@/tenants/tenant.entity';
import { CreateServiceDto } from '@/tenants/dto/create-service.dto';
import { UpdateServiceDto } from '@/tenants/dto/update-service.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly parser: OpenApiParserService,
    private readonly tools: ToolProviderService,
    private readonly telegram: TelegramApiService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
  ) {}

  async listTenants(userId: string): Promise<TenantEntity[]> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { tenant: { services: true } },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return [this.serializeTenant(user.tenant)];
  }

  async getTenant(userId: string, tenantId: string): Promise<TenantEntity> {
    await this.assertOwned(userId, tenantId);
    const tenant = await this.tenants.findOne({
      where: { id: tenantId },
      relations: { services: true },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
    return this.serializeTenant(tenant);
  }

  async listServices(
    userId: string,
    tenantId: string,
  ): Promise<ServiceEntity[]> {
    await this.assertOwned(userId, tenantId);
    const services = await this.services.find({ where: { tenantId } });
    return services.map((service) => this.serialize(service));
  }

  async createService(
    userId: string,
    tenantId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceEntity> {
    await this.assertOwned(userId, tenantId);

    try {
      await this.parser.parse(dto.openapiSpec);
    } catch (err) {
      throw new BadRequestException(
        `Invalid OpenAPI spec: ${err instanceof Error ? err.message : err}`,
      );
    }

    const bot = await this.telegram.getMe(dto.botToken);
    if (!bot.ok) {
      throw new BadRequestException(
        'Invalid Telegram bot token (getMe failed)',
      );
    }

    const publicBaseUrl = this.config.get<string>('PUBLIC_BASE_URL');
    if (!publicBaseUrl) {
      throw new BadRequestException(
        'PUBLIC_BASE_URL is not configured; cannot register the webhook',
      );
    }

    const webhookUrl = `${publicBaseUrl}/telegram/webhook/${dto.botToken}`;
    const webhookOk = await this.telegram.setWebhook(dto.botToken, webhookUrl);
    if (!webhookOk) {
      throw new BadRequestException('Failed to register the Telegram webhook');
    }

    const service = this.services.create({
      tenantId,
      name: dto.name,
      baseUrl: dto.baseUrl,
      openapiSpec: this.crypto.encrypt(dto.openapiSpec),
      botToken: this.crypto.encrypt(dto.botToken),
      botTokenHash: this.crypto.hashBotToken(dto.botToken),
      authHeaderName: dto.authHeaderName ?? null,
      authHeaderValue: dto.authHeaderValue
        ? this.crypto.encrypt(dto.authHeaderValue)
        : null,
    });

    try {
      return this.serialize(await this.services.save(service));
    } catch (err) {
      this.logger.error(`Failed to save service: ${String(err)}`);
      throw new ConflictException(
        'This bot token is already registered to another service',
      );
    }
  }

  async updateService(
    userId: string,
    tenantId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    await this.assertOwned(userId, tenantId);
    const service = await this.services.findOne({
      where: { id: serviceId, tenantId },
    });
    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    if (dto.openapiSpec !== undefined) {
      try {
        await this.parser.parse(dto.openapiSpec);
      } catch (err) {
        throw new BadRequestException(
          `Invalid OpenAPI spec: ${err instanceof Error ? err.message : err}`,
        );
      }
      service.openapiSpec = this.crypto.encrypt(dto.openapiSpec);
    }
    if (dto.name !== undefined) service.name = dto.name;
    if (dto.baseUrl !== undefined) service.baseUrl = dto.baseUrl;
    if (dto.authHeaderName !== undefined) {
      service.authHeaderName = dto.authHeaderName || null;
    }
    if (dto.authHeaderValue) {
      service.authHeaderValue = this.crypto.encrypt(dto.authHeaderValue);
    }

    const updated = await this.services.save(service);
    await this.tools.invalidate(serviceId);
    return this.serialize(updated);
  }

  async deleteService(
    userId: string,
    tenantId: string,
    serviceId: string,
  ): Promise<void> {
    await this.assertOwned(userId, tenantId);
    const result = await this.services.delete({ id: serviceId, tenantId });
    if (!result.affected) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }
  }

  private async assertOwned(userId: string, tenantId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }
  }

  private serializeTenant(tenant: TenantEntity): TenantEntity {
    return {
      ...tenant,
      services: tenant.services?.map((service) => this.serialize(service)),
    };
  }

  private serialize(service: ServiceEntity): ServiceEntity {
    return {
      ...service,
      openapiSpec: this.crypto.decrypt(service.openapiSpec) ?? '',
      botToken: this.crypto.decrypt(service.botToken) ?? '',
      authHeaderValue: null,
    };
  }
}
