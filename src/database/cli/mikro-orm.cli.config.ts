import { defineConfig } from '@mikro-orm/core';
import { DB_CONTEXTS } from '../database.constants';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseEnvironmentReader } from '../env/database-environment.reader';
import { DatabaseEnvironmentValidator } from '../env/database-environment.validator';
import { DatabaseOptionsFactory } from '../options/database-options.factory';
import { MongoDbOptionsStrategy } from '../options/mongodb-options.strategy';
import { PostgreSqlOptionsStrategy } from '../options/postgresql-options.strategy';
import { DatabaseContextRegistry } from '../registration/database-context.registry';
import { DatabaseContextConfigService } from '../runtime/database-context-config.service';

const contextRegistry = new DatabaseContextRegistry();
const environmentReader = new DatabaseEnvironmentReader();
const environmentValidator = new DatabaseEnvironmentValidator();
const contextConfigService = new DatabaseContextConfigService(
  contextRegistry,
  environmentReader,
  environmentValidator,
);
const databaseOptionsFactory = new DatabaseOptionsFactory(
  contextConfigService,
  new PostgreSqlOptionsStrategy(),
  new MongoDbOptionsStrategy(),
);
const mainContext = contextConfigService.getContext(DB_CONTEXTS.MAIN);

if (mainContext.settings.driver !== 'postgresql') {
  throw new DatabaseConfigurationError(
    'MikroORM CLI migrations require an SQL context. Runtime can still use MongoDB, but the CLI config only supports SQL migrations.',
  );
}

export default defineConfig(databaseOptionsFactory.create(DB_CONTEXTS.MAIN));
