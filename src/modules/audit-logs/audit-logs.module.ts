import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogService } from './services/audit-log.service';
import { AuditCleanupService } from './services/audit-cleanup.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditLogQueueService } from './services/audit-log-queue.service';
import { BullModule } from '@nestjs/bull';
import { QueueName } from '@/common/constants/queue.constant';
import { AuditLogProcessor } from './processors/audit-log.processor';
import { registerEntities } from '@/database/entity-registry.helper';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: QueueName.AUDIT_LOG,
    }),
    ...registerEntities([AuditLog]),
  ],
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogService,
    AuditLogQueueService,
    AuditLogProcessor,
    AuditCleanupService,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: AuditInterceptor,
    },
  ],
  exports: [AuditInterceptor, AuditLogQueueService, BullModule],
})
export class AuditLogsModule {}
