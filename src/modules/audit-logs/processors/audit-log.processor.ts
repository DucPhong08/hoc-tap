import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QueueName, AuditLogJob } from '@/common/constants/queue.constant';
import { AuditLogService } from '../services/audit-log.service';
import type { LogActionData } from '../constants/audit-log.constant';

export type AuditLogJobPayload = {
  log: LogActionData;
};

@Processor(QueueName.AUDIT_LOG)
export class AuditLogProcessor {
  private readonly logger = new Logger(AuditLogProcessor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.verbose(
      `Activating Audit Log job ${job.id} of type ${job.name}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job): void {
    this.logger.verbose(`Audit Log job ${job.id} completed`);
  }

  @OnQueueError()
  onError(err: any): void {
    this.logger.error(
      `Error in Audit Log queue: ${err?.message || String(err)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Failed Audit Log job ${job.id} with error: ${error.message}`,
    );
  }

  @Process(AuditLogJob.PROCESS_BATCH)
  async handleProcessLog(job: Job<AuditLogJobPayload>): Promise<void> {
    const { log } = job.data;
    if (!log) return;
    await this.auditLogService.log(log);
  }
}
