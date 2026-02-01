import { Module } from '@nestjs/common';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogService } from './services/audit-log.service';

@Module({
  providers: [AuditLogRepository, AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
