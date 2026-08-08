import { Module } from '@nestjs/common';
import { AgentsModule } from '@/agents/agents.module';
import { SessionService } from '@/sessions/session.service';

@Module({
  imports: [AgentsModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionsModule {}
