export const DB_CONTEXTS = {
  MAIN: 'main',
  LOGS: 'logs',
} as const;

export type DbContext = (typeof DB_CONTEXTS)[keyof typeof DB_CONTEXTS];

export const DB_CONNECTION_PROFILES = {
  SQL: 'sql',
  MONGO: 'mongo',
} as const;

export type DbConnectionProfile =
  (typeof DB_CONNECTION_PROFILES)[keyof typeof DB_CONNECTION_PROFILES];

export const DB_CONTEXT_CONNECTION_PROFILES: Record<
  DbContext,
  DbConnectionProfile
> = {
  [DB_CONTEXTS.MAIN]: DB_CONNECTION_PROFILES.MONGO,
  [DB_CONTEXTS.LOGS]: DB_CONNECTION_PROFILES.MONGO,
};
