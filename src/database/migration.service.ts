import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { bool, isProd } from '@/config/env';
import { DB_ORMS, type DbContext } from './database.constants';
import { DB_CONTEXT_NAMES } from './database.contexts';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(@Inject(DB_ORMS) private readonly orms: MikroORM[]) {}

  async onModuleInit() {
    await Promise.all(
      this.orms.map((orm, index) => this.migrate(DB_CONTEXT_NAMES[index], orm)),
    );
  }

  private async migrate(name: DbContext, orm: MikroORM) {
    const prefix = `DB_${name.toUpperCase()}_`;

    if (isProd() || orm.config.get('driver') !== PostgreSqlDriver) return;

    // Prototype: sync thẳng schema, KHÔNG dùng chung với migration.
    if (bool(`${prefix}SYNC_SCHEMA`)) {
      await orm.schema.updateSchema();
      this.logger.warn(`[${name}] đã sync schema (không qua migration)`);
      return;
    }

    if (!bool(`${prefix}AUTO_MIGRATE`)) return;

    const pending = await orm.migrator.getPendingMigrations();
    if (!pending.length) return;

    await orm.migrator.up();
    this.logger.log(`[${name}] đã chạy ${pending.length} migration`);
  }
}
