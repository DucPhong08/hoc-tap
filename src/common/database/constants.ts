export const DB_CONTEXTS = {
  MAIN: 'main',
  LOGS: 'logs',
} as const;

export type DbContext = (typeof DB_CONTEXTS)[keyof typeof DB_CONTEXTS];
