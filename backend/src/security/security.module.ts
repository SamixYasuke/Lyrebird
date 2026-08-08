import { Module } from '@nestjs/common';
import { CryptoService } from '@/security/crypto.service';

@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class SecurityModule {}
