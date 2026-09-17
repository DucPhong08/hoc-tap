import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Entity } from '@/common/enums/entity.enum';
import { RepositoryProvider } from '@/infra/repositories/common/repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogService } from './services/audit-log.service';
import { AuditCleanupService } from './services/audit-cleanup.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditLogQueueService } from './services/audit-log-queue.service';
import { BullModule } from '@nestjs/bull';
import { QueueName } from '@/common/constants/queue.constant';
import { AuditLogProcessor } from './processors/audit-log.processor';

const hasRedis = Boolean(process.env.REDIS_HOST);

@Global()
@Module({
  imports: [
    ...(hasRedis
      ? [
          BullModule.registerQueue({
            name: QueueName.AUDIT_LOG,
          }),
        ]
      : []),
  ],
  controllers: [AuditLogController],
  providers: [
    RepositoryProvider(Entity.AUDIT_LOG, AuditLogRepository),
    AuditLogService,
    AuditLogQueueService,
    ...(hasRedis ? [AuditLogProcessor] : []),
    AuditCleanupService,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: AuditInterceptor,
    },
  ],
  exports: [
    AuditInterceptor,
    AuditLogQueueService,
    AuditLogService,
    ...(hasRedis ? [BullModule] : []),
  ],
})
export class AuditLogsModule {}
