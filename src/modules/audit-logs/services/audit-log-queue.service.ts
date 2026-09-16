import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueName, AuditLogJob } from '@/common/constants/queue.constant';
import type { AuditLogJobPayload } from '../processors/audit-log.processor';
import type { LogActionData } from '../constants/audit-log.constant';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditLogQueueService {
  private readonly logger = new Logger(AuditLogQueueService.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    @Optional()
    @InjectQueue(QueueName.AUDIT_LOG)
    private readonly auditQueue?: Queue<AuditLogJobPayload>,
  ) {}

  dispatch(data: LogActionData): void {
    if (this.auditQueue) {
      this.auditQueue
        .add(
          AuditLogJob.PROCESS_BATCH,
          { log: data },
          {
            attempts: 3,
            backoff: 1000,
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        )
        .catch((error) => {
          this.logger.error('Failed to dispatch audit log to queue:', error);
        });
    } else {
      this.auditLogService.log(data).catch((error) => {
        this.logger.error(
          `Direct audit log write failed: ${(error as Error).message}`,
        );
      });
    }
  }
}
