import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '@/security/crypto.service';
import { ServiceEntity } from '@/tenants/service.entity';

@Injectable()
export class EncryptionMigratorService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionMigratorService.name);

  constructor(
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
    private readonly crypto: CryptoService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.services.find();
    let migrated = 0;
    for (const row of rows) {
      let changed = false;

      if (!row.botTokenHash) {
        const rawToken = this.crypto.decrypt(row.botToken) ?? '';
        row.botTokenHash = this.crypto.hashBotToken(rawToken);
        changed = true;
      }
      if (!this.crypto.isEncrypted(row.botToken)) {
        row.botToken = this.crypto.encrypt(row.botToken);
        changed = true;
      }
      if (!this.crypto.isEncrypted(row.openapiSpec)) {
        row.openapiSpec = this.crypto.encrypt(row.openapiSpec);
        changed = true;
      }
      if (
        row.authHeaderValue &&
        !this.crypto.isEncrypted(row.authHeaderValue)
      ) {
        row.authHeaderValue = this.crypto.encrypt(row.authHeaderValue);
        changed = true;
      }

      if (changed) {
        await this.services.save(row);
        migrated++;
      }
    }
    if (migrated > 0) {
      this.logger.log(`Encrypted ${migrated} legacy service row(s) at rest`);
    }
  }
}
