import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DB_CONTEXTS } from './database.constants';
import { context } from './database.contexts';
import { DatabaseConfigurationError } from './errors/database-configuration.error';
import { databaseOptions } from './env/database.options';

const contextName = process.env.MIKRO_ORM_CLI_CONTEXT ?? DB_CONTEXTS.MAIN;
const options = databaseOptions(context(contextName));

if (options.driver === MongoDriver) {
  throw new DatabaseConfigurationError(
    `CLI migrations cần SQL. Context "${contextName}" đang dùng MongoDB.`,
  );
}

export default defineConfig(options);
