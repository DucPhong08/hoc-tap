import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { RootConfig } from '../config/root.config';
import { DB_CONTEXTS } from '../common/database/constants';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectMikroORM(DB_CONTEXTS.MAIN)
    private readonly orm: MikroORM,
    private readonly configService: ConfigService<RootConfig>,
  ) {}

  async onModuleInit() {
    const mode = this.configService.get('mode', { infer: true });
    const autoMigrate = this.configService.get(
      'databases.main.dev.autoMigrate',
      { infer: true },
    );

    if (mode !== 'production' && autoMigrate) {
      const migrator = this.orm.migrator;

      await migrator.up();
      console.log('Migrations executed successfully');
    }
  }
}
