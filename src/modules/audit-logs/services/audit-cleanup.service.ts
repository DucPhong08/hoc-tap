import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { DB_CONTEXTS } from '@/database/database.constants';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);
  private readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(
    private readonly auditLogService: AuditLogService,
    @InjectMikroORM(DB_CONTEXTS.LOGS) private readonly logsOrm: MikroORM,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  @CreateRequestContext((service: AuditCleanupService) => service.logsOrm)
  async dailyCleanup(): Promise<void> {
    try {
      await this.runCleanup(this.DEFAULT_RETENTION_DAYS, 'Scheduled');
    } catch (error) {
      this.logger.error('Scheduled audit log cleanup failed', error as Error);
    }
  }

  @CreateRequestContext((service: AuditCleanupService) => service.logsOrm)
  cleanup(retentionDays: number): Promise<number> {
    return this.runCleanup(retentionDays, 'Manual');
  }

  private async runCleanup(
    retentionDays: number,
    label: 'Scheduled' | 'Manual',
  ): Promise<number> {
    this.logger.log(
      `${label} audit log cleanup started (${retentionDays} days retention)...`,
    );

    try {
      const deleted = await this.auditLogService.cleanup(retentionDays);
      this.logger.log(
        `${label} audit log cleanup completed. Deleted ${deleted} old records.`,
      );
      return deleted;
    } catch (error) {
      this.logger.error(`${label} audit log cleanup failed`, error as Error);
      throw error;
    }
  }
}
