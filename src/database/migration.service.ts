import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { DatabaseContextConfigService } from './runtime/database-context-config.service';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN)
    private readonly orm: MikroORM,
    private readonly contextConfigService: DatabaseContextConfigService,
  ) {}

  async onModuleInit() {
    const databaseContext = this.contextConfigService.getContext(
      DB_CONTEXTS.MAIN,
    );
    const { settings } = databaseContext;

    if (
      settings.driver !== 'postgresql' ||
      settings.applicationMode === 'production' ||
      !settings.autoMigrationEnabled
    ) {
      return;
    }

    try {
      await this.runPendingMigrations();
    } catch {
      // Ignore migration extension/runtime warnings in development startup flow.
    }

    await this.syncSchema();
  }

  private async runPendingMigrations() {
    const migrator = this.orm.migrator;
    const pendingMigrations = await migrator.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      return;
    }

    await migrator.up();
  }

  private async syncSchema() {
    const generator = this.orm.getSchemaGenerator();
    const pendingSchemaDiff = await generator.getUpdateSchemaSQL();

    if (!pendingSchemaDiff.trim()) {
      return;
    }

    await generator.updateSchema();
  }
}
