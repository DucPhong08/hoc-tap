import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLogService } from './audit-log.service';

/**
 * Service to automatically cleanup old audit logs
 * Runs scheduled jobs to maintain database size
 */
@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);
  private readonly DEFAULT_RETENTION_DAYS = 90; // Keep logs for 90 days by default

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Run cleanup every day at 2 AM
   * You can customize the schedule using cron expressions
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('Starting scheduled audit log cleanup...');

    try {
      const deleted = await this.auditLogService.cleanupOldLogs(
        this.DEFAULT_RETENTION_DAYS,
      );

      this.logger.log(
        `Audit log cleanup completed. Deleted ${deleted} old records.`,
      );

      // You could also log this cleanup action itself
      // await this.auditLogService.log({
      //     action: AuditAction.DELETE,
      //     entityType: 'AuditLog',
      //     entityId: 'cleanup',
      //     userId: 'system',
      //     description: `Cleanup deleted ${deleted} old audit logs`,
      // });
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs', error);
    }
  }

  /**
   * Run cleanup every week on Sunday at 3 AM
   * For more aggressive cleanup of very old logs
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyDeepCleanup() {
    this.logger.log('Starting weekly deep cleanup...');

    try {
      // Delete logs older than 180 days (6 months)
      const deleted = await this.auditLogService.cleanupOldLogs(180);

      this.logger.log(
        `Weekly deep cleanup completed. Deleted ${deleted} very old records.`,
      );
    } catch (error) {
      this.logger.error('Failed to run weekly cleanup', error);
    }
  }

  /**
   * Manual cleanup with custom retention period
   */
  async manualCleanup(retentionDays: number): Promise<number> {
    this.logger.log(
      `Running manual cleanup (${retentionDays} days retention)...`,
    );

    try {
      const deleted = await this.auditLogService.cleanupOldLogs(retentionDays);
      this.logger.log(`Manual cleanup completed. Deleted ${deleted} records.`);
      return deleted;
    } catch (error) {
      this.logger.error('Manual cleanup failed', error);
      throw error;
    }
  }
}
