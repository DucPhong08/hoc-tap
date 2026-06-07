import { Options } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseContextConfigService } from '../runtime/database-context-config.service';
import { MongoDbOptionsStrategy } from './mongodb-options.strategy';
import { PostgreSqlOptionsStrategy } from './postgresql-options.strategy';
import { DatabaseContextRegistry } from '../registration/database-context.registry';
import { DatabaseEnvironmentReader } from '../env/database-environment.reader';
import { DatabaseEnvironmentValidator } from '../env/database-environment.validator';

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

  static createStandalone(contextName: string): Options {
    const contextRegistry = new DatabaseContextRegistry();
    const environmentReader = new DatabaseEnvironmentReader();
    const environmentValidator = new DatabaseEnvironmentValidator();
    const contextConfigService = new DatabaseContextConfigService(
      contextRegistry,
      environmentReader,
      environmentValidator,
    );
    const factory = new DatabaseOptionsFactory(
      contextConfigService,
      new PostgreSqlOptionsStrategy(),
      new MongoDbOptionsStrategy(),
    );
    return factory.create(contextName);
  }
}
