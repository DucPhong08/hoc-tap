export const DB_CONTEXTS = {
  MAIN: 'main',
  LOGS: 'logs',
} as const;

export type DbContext = (typeof DB_CONTEXTS)[keyof typeof DB_CONTEXTS];

/** Mảng MikroORM instance của tất cả context, theo thứ tự DB_CONTEXT_NAMES. */
export const DB_ORMS = Symbol('DB_ORMS');
