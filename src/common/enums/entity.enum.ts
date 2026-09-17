export enum Entity {
  USER = 'users',
  SETTING = 'settings',
  AUDIT_LOG = 'audit_logs',
  SESSION = 'sessions',
  // PLOP: ADD_ENTITY_ENUM
}

export { Entity as Table, Entity as EntityName };
export type EntityType = `${Entity}`;
