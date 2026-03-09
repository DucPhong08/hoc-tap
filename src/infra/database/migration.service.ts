import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { DB_CONTEXTS } from '../../modules/database/constants';
import { RootConfig } from '../../config/root.config';
import { DevConfig } from '../../config/root/database/dev.config';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN)
    private readonly orm: MikroORM,
    private readonly configService: ConfigService<RootConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    const defaultDevConfig: DevConfig = {
      autoMigrate: false,
      autoSyncSchema: false,
      debug: false,
    };

    const mode =
      this.configService.get<RootConfig['mode']>('mode') || 'development';
    const databases =
      this.configService.get<RootConfig['databases']>('databases');
    const devConfig = databases?.[DB_CONTEXTS.MAIN]?.dev || defaultDevConfig;

    const autoMigrate = devConfig.autoMigrate === true;
    const autoSyncSchema = devConfig.autoSyncSchema === true;

    if (mode === 'production') {
      return;
    }

    if (autoMigrate && autoSyncSchema) {
      this.logger.warn(
        'Both autoMigrate and autoSyncSchema are enabled. Prioritizing autoMigrate.',
      );
    }

    if (autoMigrate) {
      await this.runPendingMigrations();
      return;
    }

    if (autoSyncSchema) {
      await this.syncSchema();
    }
  }

  private async runPendingMigrations(): Promise<void> {
    const migrator = this.orm.migrator;

    try {
      const pending = await migrator.getPendingMigrations();

      if (pending.length === 0) {
        return;
      }

      this.logger.log(
        `Auto-migration: found ${pending.length} pending migration(s)`,
      );
      pending.forEach((migration) =>
        this.logger.log(`Auto-migration pending: ${migration.name}`),
      );

      const executed = await migrator.up();
      if (executed.length > 0) {
        this.logger.log(
          `Auto-migration: executed ${executed.length} migration(s) successfully`,
        );
      }
    } catch (error) {
      if (this.shouldBootstrapSchema(error)) {
        this.logger.warn(
          'Migration failed due to missing tables. Bootstrapping schema once and retrying pending migrations.',
        );

        const synced = await this.syncSchema(false);
        if (synced) {
          await this.retryPendingMigrations(migrator);
          return;
        }
      }

      this.logger.warn(
        `Auto-migration warning: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async retryPendingMigrations(migrator: MikroORM['migrator']) {
    try {
      const pending = await migrator.getPendingMigrations();
      if (pending.length === 0) {
        return;
      }

      const executed = await migrator.up();
      if (executed.length > 0) {
        this.logger.log(
          `Auto-migration retry: executed ${executed.length} migration(s) successfully`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Auto-migration retry warning: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async syncSchema(showAdvisory: boolean = true): Promise<boolean> {
    try {
      const generator = this.orm.getSchemaGenerator();
      const updateDiff = await generator.getUpdateSchemaSQL();

      if (!updateDiff.trim()) {
        return false;
      }

      if (showAdvisory) {
        this.logger.warn(
          'Auto-sync schema is enabled (development only). Prefer migrations for production parity.',
        );
      }
      await generator.updateSchema();
      this.logger.log('Auto-sync: schema updated successfully');
      return true;
    } catch (error) {
      this.logger.warn(`Auto-sync warning: ${this.getErrorMessage(error)}`);
      return false;
    }
  }

  private shouldBootstrapSchema(error: unknown): boolean {
    const message = this.getErrorMessage(error);
    return /relation\s+"[^"]+"\s+does not exist/i.test(message);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
