import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  host: process.env.BE_DATABASES_MAIN_CONNECTION_HOST || 'localhost',
  port: parseInt(process.env.BE_DATABASES_MAIN_CONNECTION_PORT || '5432'),
  user: process.env.BE_DATABASES_MAIN_CONNECTION_USER || 'postgres',
  password: process.env.BE_DATABASES_MAIN_CONNECTION_PASSWORD || '123456',
  dbName: process.env.BE_DATABASES_MAIN_CONNECTION_DATABASE || 'hoc-tap',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    allOrNothing: true,
    dropTables: false,
    disableForeignKeys: false,
    safe: true,
    snapshot: true,
    transactional: true,
  },
  extensions: [Migrator],
});
