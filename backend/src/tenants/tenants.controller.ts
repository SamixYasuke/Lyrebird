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
import { AdminKeyGuard } from '@/tenants/admin-key.guard';
import { TenantsService } from '@/tenants/tenants.service';
import { CreateServiceDto } from '@/tenants/dto/create-service.dto';
import { CreateTenantDto } from '@/tenants/dto/create-tenant.dto';
import { UpdateServiceDto } from '@/tenants/dto/update-service.dto';
import { ServiceEntity } from '@/tenants/service.entity';
import { TenantEntity } from '@/tenants/tenant.entity';

@Controller('tenants')
@UseGuards(AdminKeyGuard)
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  createTenant(@Body() dto: CreateTenantDto): Promise<TenantEntity> {
    return this.tenants.createTenant(dto);
  }

  @Get()
  listTenants(): Promise<TenantEntity[]> {
    return this.tenants.listTenants();
  }

  @Get(':tenantId')
  getTenant(@Param('tenantId') tenantId: string): Promise<TenantEntity> {
    return this.tenants.getTenant(tenantId);
  }

  @Get(':tenantId/services')
  listServices(@Param('tenantId') tenantId: string): Promise<ServiceEntity[]> {
    return this.tenants.listServices(tenantId);
  }

  @Post(':tenantId/services')
  createService(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceEntity> {
    return this.tenants.createService(tenantId, dto);
  }

  @Delete(':tenantId/services/:serviceId')
  async deleteService(
    @Param('tenantId') tenantId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ ok: boolean }> {
    await this.tenants.deleteService(tenantId, serviceId);
    return { ok: true };
  }

  @Patch(':tenantId/services/:serviceId')
  updateService(
    @Param('tenantId') tenantId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    return this.tenants.updateService(tenantId, serviceId, dto);
  }
}
