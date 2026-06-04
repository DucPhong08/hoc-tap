import {
  MikroOrmModuleOptions,
  MikroOrmOptionsFactory,
} from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { DB_CONTEXTS } from '../database.constants';
import { DatabaseOptionsFactory } from '../options/database-options.factory';

@Injectable()
export class LogsMikroOrmOptionsFactory implements MikroOrmOptionsFactory {
  constructor(
    private readonly databaseOptionsFactory: DatabaseOptionsFactory,
  ) {}

  createMikroOrmOptions(): MikroOrmModuleOptions {
    return {
      ...this.databaseOptionsFactory.create(DB_CONTEXTS.LOGS),
      autoLoadEntities: false,
      registerRequestContext: false,
    };
  }
}
