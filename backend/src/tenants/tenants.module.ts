import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '@/agents/agents.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { SecurityModule } from '@/security/security.module';
import { EncryptionMigratorService } from '@/tenants/encryption-migrator.service';
import { TenantsController } from '@/tenants/tenants.controller';
import { TenantsService } from '@/tenants/tenants.service';
import { ServiceEntity } from '@/tenants/service.entity';
import { TenantEntity } from '@/tenants/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, ServiceEntity]),
    AgentsModule,
    TelegramModule,
    SecurityModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, EncryptionMigratorService],
  exports: [TenantsService],
})
export class TenantsModule {}
