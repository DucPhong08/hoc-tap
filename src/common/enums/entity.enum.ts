export enum Entity {
  USER = 'users',
  SETTING = 'settings',
  AUDIT_LOG = 'audit_logs',
  SESSION = 'sessions',
}

export { Entity as Table, Entity as EntityName };
export type EntityType = `${Entity}`;
