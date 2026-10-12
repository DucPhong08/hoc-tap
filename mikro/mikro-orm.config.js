const { defineConfig } = require('@mikro-orm/core');
const { MongoDriver } = require('@mikro-orm/mongodb');
const { DB_CONTEXTS } = require('../dist/database/database.constants');
const { context } = require('../dist/database/database.contexts');
const { databaseOptions } = require('../dist/database/env/database.options');

const contextName = process.env.MIKRO_ORM_CLI_CONTEXT ?? DB_CONTEXTS.MAIN;
const options = databaseOptions(context(contextName));

if (options.driver === MongoDriver) {
  throw new Error(
    `CLI migrations cần SQL. Context "${contextName}" đang dùng MongoDB.`,
  );
}

module.exports = defineConfig({ ...options, preferTs: false });
