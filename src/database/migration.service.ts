import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { DB_CONTEXTS } from '@/database/database.constants';
import { DatabaseContextConfigService } from './runtime/database-context-config.service';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN)
    private readonly mainOrm: MikroORM,
    @InjectMikroORM(DB_CONTEXTS.LOGS)
    private readonly logsOrm: MikroORM,
    private readonly contextConfigService: DatabaseContextConfigService,
  ) {}

  async onModuleInit() {
    await this.migrateContext(DB_CONTEXTS.MAIN, this.mainOrm);
    await this.migrateContext(DB_CONTEXTS.LOGS, this.logsOrm);
  }

  private async migrateContext(contextName: string, orm: MikroORM) {
    const { settings } = this.contextConfigService.getContext(contextName);

    if (
      settings.driver !== 'postgresql' ||
      settings.applicationMode === 'production' ||
      !settings.autoMigrationEnabled
    ) {
      return;
    }

    try {
      const migrator = orm.migrator;
      const pendingMigrations = await migrator.getPendingMigrations();

      if (pendingMigrations.length > 0) {
        await migrator.up();
      }
    } catch {
      // Ignore migration extension/runtime warnings in development startup flow.
    }

    await orm.schema.updateSchema();
  }
}
