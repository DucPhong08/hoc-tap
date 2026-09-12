import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);
  private readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(private readonly auditLogService: AuditLogService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyCleanup() {
    this.logger.log('Starting scheduled audit log cleanup...');

    try {
      const deleted = await this.auditLogService.cleanup(
        this.DEFAULT_RETENTION_DAYS,
      );

      this.logger.log(
        `Audit log cleanup completed. Deleted ${deleted} old records.`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyDeepCleanup() {
    this.logger.log('Starting weekly deep cleanup...');

    try {
      const deleted = await this.auditLogService.cleanup(180);

      this.logger.log(
        `Weekly deep cleanup completed. Deleted ${deleted} very old records.`,
      );
    } catch (error) {
      this.logger.error('Failed to run weekly cleanup', error);
    }
  }

  async cleanup(retentionDays: number): Promise<number> {
    this.logger.log(
      `Running manual cleanup (${retentionDays} days retention)...`,
    );

    try {
      const deleted = await this.auditLogService.cleanup(retentionDays);
      this.logger.log(`Manual cleanup completed. Deleted ${deleted} records.`);
      return deleted;
    } catch (error) {
      this.logger.error('Manual cleanup failed', error);
      throw error;
    }
  }
}
