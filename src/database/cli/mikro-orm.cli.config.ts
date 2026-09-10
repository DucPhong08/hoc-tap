import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DB_CONTEXTS } from '../database.constants';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseEnvReader } from '../env/database-env';
import { DatabaseContextRegistry } from '../registration/database-context.registry';

// Đổi context: MIKRO_ORM_CLI_CONTEXT=logs npx mikro-orm migration:create
const contextName = process.env.MIKRO_ORM_CLI_CONTEXT ?? DB_CONTEXTS.MAIN;
const options = new DatabaseEnvReader().buildOptions(
  new DatabaseContextRegistry().get(contextName),
);

if (options.driver === MongoDriver) {
  throw new DatabaseConfigurationError(
    `CLI migrations require SQL. Context "${contextName}" uses MongoDB.`,
  );
}

export default defineConfig(options);
