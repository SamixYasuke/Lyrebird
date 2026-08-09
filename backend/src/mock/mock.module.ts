import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { MockController } from '@/mock/mock.controller';
import { MockService } from '@/mock/mock.service';
import { UserEntity } from '@/auth/user.entity';

@Module({
  imports: [TenantsModule, AuthModule, TypeOrmModule.forFeature([UserEntity])],
  controllers: [MockController],
  providers: [MockService],
})
export class MockModule {}
