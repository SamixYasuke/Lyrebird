import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '@/agents/agents.module';
import { TelegramModule } from '@/telegram/telegram.module';
import { SecurityModule } from '@/security/security.module';
import { AuthModule } from '@/auth/auth.module';
import { EncryptionMigratorService } from '@/tenants/encryption-migrator.service';
import { TenantsController } from '@/tenants/tenants.controller';
import { TenantsService } from '@/tenants/tenants.service';
import { ServiceEntity } from '@/tenants/service.entity';
import { TenantEntity } from '@/tenants/tenant.entity';
import { UserEntity } from '@/auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, ServiceEntity, UserEntity]),
    AgentsModule,
    TelegramModule,
    SecurityModule,
    AuthModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, EncryptionMigratorService],
  exports: [TenantsService],
})
export class TenantsModule {}
