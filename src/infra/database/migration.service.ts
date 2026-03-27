import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { DB_CONTEXTS } from 'src/modules/database/constants';
import { RootConfig } from 'src/config/root.config';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN)
    private readonly orm: MikroORM,
    private readonly configService: ConfigService<RootConfig>,
  ) {}

  async onModuleInit() {
    const mode = this.configService.get('mode', { infer: true });
    const devConfig = this.configService.get('databases.main.dev', {
      infer: true,
    });
    const connectionType = this.configService.get(
      'databases.main.connection.connection',
      { infer: true },
    );
    const autoMigrate = devConfig?.autoMigrate === true;
    const shouldRunSqlSchemaTasks =
      connectionType === 'postgresql' || connectionType === 'mysql';

    if (mode === 'production' || !autoMigrate || !shouldRunSqlSchemaTasks) {
      return;
    }

    // 1. Chạy pending migrations (nếu có)
    try {
      await this.runPendingMigrations();
    } catch {
      // Ignore migration extension/runtime warnings in development startup flow.
    }

    // 2. Auto sync schema từ entity → DB (luôn chạy)
    await this.syncSchema();
  }

  private async runPendingMigrations() {
    const migrator = this.orm.migrator;
    const pending = await migrator.getPendingMigrations();

    if (pending.length === 0) return;

    const executed = await migrator.up();
    if (executed.length === 0) return;
  }

  private async syncSchema() {
    const generator = this.orm.getSchemaGenerator();
    const updateDiff = await generator.getUpdateSchemaSQL();

    if (!updateDiff.trim()) return;

    await generator.updateSchema();
  }
}
