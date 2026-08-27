import { Options } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseContextConfigService } from '../runtime/database-context-config.service';
import { MongoDbOptionsStrategy } from './mongodb-options.strategy';
import { PostgreSqlOptionsStrategy } from './postgresql-options.strategy';
import { DatabaseContextRegistry } from '../registration/database-context.registry';
import { DatabaseEnvironmentReader } from '../env/database-environment.reader';
import { DatabaseEnvironmentValidator } from '../env/database-environment.validator';
import type { DatabaseDriverOptionsStrategy } from './database-driver-options.strategy';
import type { DatabaseDriverName } from '../types/database.types';

@Injectable()
export class DatabaseOptionsFactory {
  private readonly strategyMap = new Map<
    DatabaseDriverName,
    DatabaseDriverOptionsStrategy
  >();

  private static standaloneInstance?: DatabaseOptionsFactory;

  constructor(
    private readonly contextConfigService: DatabaseContextConfigService,
    postgreSqlOptionsStrategy: PostgreSqlOptionsStrategy,
    mongoDbOptionsStrategy: MongoDbOptionsStrategy,
  ) {
    const strategies: DatabaseDriverOptionsStrategy[] = [
      postgreSqlOptionsStrategy,
      mongoDbOptionsStrategy,
    ];

    for (const strategy of strategies) {
      if (strategy.supports('postgresql')) {
        this.strategyMap.set('postgresql', strategy);
      }
      if (strategy.supports('mongodb')) {
        this.strategyMap.set('mongodb', strategy);
      }
    }
  }

  create(contextName: string): Options {
    const context = this.contextConfigService.getContext(contextName);
    const driver = context.settings.driver;
    const strategy = this.strategyMap.get(driver);

    if (!strategy) {
      throw new DatabaseConfigurationError(
        `No MikroORM options strategy found for driver "${driver}".`,
      );
    }

    return strategy.buildOptions(context);
  }

  static createStandalone(contextName: string): Options {
    if (!this.standaloneInstance) {
      const contextRegistry = new DatabaseContextRegistry();
      const environmentReader = new DatabaseEnvironmentReader();
      const environmentValidator = new DatabaseEnvironmentValidator();
      const contextConfigService = new DatabaseContextConfigService(
        contextRegistry,
        environmentReader,
        environmentValidator,
      );
      this.standaloneInstance = new DatabaseOptionsFactory(
        contextConfigService,
        new PostgreSqlOptionsStrategy(),
        new MongoDbOptionsStrategy(),
      );
    }
    return this.standaloneInstance.create(contextName);
  }
}
