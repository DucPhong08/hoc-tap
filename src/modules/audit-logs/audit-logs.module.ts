import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogService } from './services/audit-log.service';
import { AuditCleanupService } from './services/audit-cleanup.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogService,
    AuditCleanupService,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: AuditInterceptor,
    },
  ],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditLogsModule {}
