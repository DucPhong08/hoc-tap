export const APP_PREFIX = 'BE' as const;
export const ENV_PREFIX = `${APP_PREFIX}_` as const;
export const DEFAULT_BCRYPT_ROUNDS = 10;

export const DATABASE_FIELD_ALIASES: Record<string, string> = {
  automigrate: 'autoMigrate',
  autosyncschema: 'autoSyncSchema',
  pathts: 'pathTs',
};

export const LEGACY_DATABASE_CONNECTION_FIELDS: Record<string, string> = {
  connection: 'connection',
  type: 'connection',
  host: 'host',
  port: 'port',
  user: 'user',
  password: 'password',
  name: 'database',
  database: 'database',
  db: 'database',
};
