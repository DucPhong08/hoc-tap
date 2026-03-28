import { Options } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseContextConfigService } from '../runtime/database-context-config.service';
import { MongoDbOptionsStrategy } from './mongodb-options.strategy';
import { PostgreSqlOptionsStrategy } from './postgresql-options.strategy';

@Injectable()
export class DatabaseOptionsFactory {
  constructor(
    private readonly contextConfigService: DatabaseContextConfigService,
    private readonly postgreSqlOptionsStrategy: PostgreSqlOptionsStrategy,
    private readonly mongoDbOptionsStrategy: MongoDbOptionsStrategy,
  ) {}

  create(contextName: string): Options {
    const context = this.contextConfigService.getContext(contextName);
    const strategy = [
      this.postgreSqlOptionsStrategy,
      this.mongoDbOptionsStrategy,
    ].find((candidate) => candidate.supports(context.settings.driver));

    if (!strategy) {
      throw new DatabaseConfigurationError(
        `No MikroORM options strategy found for driver "${context.settings.driver}".`,
      );
    }

    return strategy.buildOptions(context);
  }
}
