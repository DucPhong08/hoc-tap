import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueName, AuditLogJob } from '@/common/constants/queue.constant';
import type { AuditLogJobPayload } from '../processors/audit-log.processor';
import type { LogActionData } from '../constants/audit-log.constant';

@Injectable()
export class AuditLogQueueService {
  private readonly logger = new Logger(AuditLogQueueService.name);

  constructor(
    @InjectQueue(QueueName.AUDIT_LOG)
    private readonly auditQueue: Queue<AuditLogJobPayload>,
  ) {}

  push(data: LogActionData): void {
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
        this.logger.error('Failed to push audit log to Bull Queue:', error);
      });
  }
}
