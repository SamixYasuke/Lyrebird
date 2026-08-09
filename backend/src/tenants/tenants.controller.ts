import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { TenantsService } from '@/tenants/tenants.service';
import { CreateServiceDto } from '@/tenants/dto/create-service.dto';
import { UpdateServiceDto } from '@/tenants/dto/update-service.dto';
import { ServiceEntity } from '@/tenants/service.entity';
import { TenantEntity } from '@/tenants/tenant.entity';
import type { UserEntity } from '@/auth/user.entity';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  listTenants(@CurrentUser() user: UserEntity): Promise<TenantEntity[]> {
    return this.tenants.listTenants(user.id);
  }

  @Get(':tenantId')
  getTenant(
    @CurrentUser() user: UserEntity,
    @Param('tenantId') tenantId: string,
  ): Promise<TenantEntity> {
    return this.tenants.getTenant(user.id, tenantId);
  }

  @Get(':tenantId/services')
  listServices(
    @CurrentUser() user: UserEntity,
    @Param('tenantId') tenantId: string,
  ): Promise<ServiceEntity[]> {
    return this.tenants.listServices(user.id, tenantId);
  }

  @Post(':tenantId/services')
  createService(
    @CurrentUser() user: UserEntity,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceEntity> {
    return this.tenants.createService(user.id, tenantId, dto);
  }

  @Delete(':tenantId/services/:serviceId')
  async deleteService(
    @CurrentUser() user: UserEntity,
    @Param('tenantId') tenantId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ ok: boolean }> {
    await this.tenants.deleteService(user.id, tenantId, serviceId);
    return { ok: true };
  }

  @Patch(':tenantId/services/:serviceId')
  updateService(
    @CurrentUser() user: UserEntity,
    @Param('tenantId') tenantId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    return this.tenants.updateService(user.id, tenantId, serviceId, dto);
  }
}
