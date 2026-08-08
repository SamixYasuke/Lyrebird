import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '@/tenants/tenant.entity';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'base_url' })
  baseUrl: string;

  @Column({ type: 'text', name: 'openapi_spec' })
  openapiSpec: string;

  @Column({ type: 'varchar', name: 'bot_token' })
  botToken: string;

  @Column({ type: 'varchar', name: 'bot_token_hash', nullable: true })
  botTokenHash: string | null;

  @Column({ type: 'varchar', name: 'auth_header_name', nullable: true })
  authHeaderName: string | null;

  @Column({ type: 'varchar', name: 'auth_header_value', nullable: true })
  authHeaderValue: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
