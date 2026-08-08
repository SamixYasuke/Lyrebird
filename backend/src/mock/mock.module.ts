import { Module } from '@nestjs/common';
import { TenantsModule } from '@/tenants/tenants.module';
import { MockController } from '@/mock/mock.controller';
import { MockService } from '@/mock/mock.service';
import { AdminKeyGuard } from '@/tenants/admin-key.guard';

@Module({
  imports: [TenantsModule],
  controllers: [MockController],
  providers: [MockService, AdminKeyGuard],
})
export class MockModule {}
