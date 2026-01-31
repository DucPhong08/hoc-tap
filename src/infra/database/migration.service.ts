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
    const autoMigrate = devConfig?.autoMigrate === true;

    if (mode !== 'production' && autoMigrate) {
      const migrator = this.orm.migrator;
      const pending = await migrator.getPendingMigrations();

      if (pending.length > 0) {
        console.log(
          `\n🔄 Auto-migration: Found ${pending.length} pending migration(s)`,
        );
        pending.forEach((migration) => {
          console.log(`   - ${migration.name}`);
        });

        const executed = await migrator.up();

        if (executed.length > 0) {
          console.log(
            `✅ Auto-migration: Executed ${executed.length} migration(s) successfully\n`,
          );
        }
      }
    }
  }
}
