import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DB_CONTEXTS } from '@/database/database.constants';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN) private readonly mainOrm: MikroORM,
    @InjectMikroORM(DB_CONTEXTS.LOGS) private readonly logsOrm: MikroORM,
  ) {}

  async onModuleInit() {
    await this.migrate(DB_CONTEXTS.MAIN, this.mainOrm);
    await this.migrate(DB_CONTEXTS.LOGS, this.logsOrm);
  }

  private async migrate(contextName: string, orm: MikroORM) {
    const p = `DB_${contextName.toUpperCase()}_`;

    if (
      orm.config.get('driver') !== PostgreSqlDriver ||
      process.env.NODE_ENV === 'production' ||
      process.env[`${p}AUTO_MIGRATE`] !== 'true'
    )
      return;

    try {
      const pending = await orm.migrator.getPendingMigrations();
      if (pending.length) await orm.migrator.up();
    } catch {
      /* bỏ qua cảnh báo khởi động */
    }

    await orm.schema.updateSchema();
  }
}
