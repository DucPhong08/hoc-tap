import { AuditAction } from '../enums/audit-action.enum';

/**
 * Audit log keys/constants
 * Similar to SettingKey enum
 */
export enum AuditKey {
  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',

  // Product actions
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',

  // Settings actions
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',

  // System actions
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  CLEANUP_EXECUTED = 'CLEANUP_EXECUTED',
}

/**
 * Audit key descriptions
 */
export const AUDIT_DESCRIPTIONS: Record<AuditKey, string> = {
  [AuditKey.USER_CREATED]: 'User account created',
  [AuditKey.USER_UPDATED]: 'User profile updated',
  [AuditKey.USER_DELETED]: 'User account deleted',
  [AuditKey.USER_LOGIN]: 'User logged in',
  [AuditKey.USER_LOGOUT]: 'User logged out',
  [AuditKey.USER_LOGIN_FAILED]: 'Failed login attempt',
  [AuditKey.USER_PASSWORD_CHANGED]: 'User password changed',

  [AuditKey.PRODUCT_CREATED]: 'Product created',
  [AuditKey.PRODUCT_UPDATED]: 'Product updated',
  [AuditKey.PRODUCT_DELETED]: 'Product deleted',

  [AuditKey.SETTINGS_UPDATED]: 'System settings updated',

  [AuditKey.DATA_EXPORTED]: 'Data exported',
  [AuditKey.DATA_IMPORTED]: 'Data imported',
  [AuditKey.CLEANUP_EXECUTED]: 'Cleanup job executed',
};

/**
 * Map audit key to action type
 */
export const AUDIT_KEY_ACTIONS: Record<AuditKey, AuditAction> = {
  [AuditKey.USER_CREATED]: AuditAction.CREATE,
  [AuditKey.USER_UPDATED]: AuditAction.UPDATE,
  [AuditKey.USER_DELETED]: AuditAction.DELETE,
  [AuditKey.USER_LOGIN]: AuditAction.LOGIN,
  [AuditKey.USER_LOGOUT]: AuditAction.LOGOUT,
  [AuditKey.USER_LOGIN_FAILED]: AuditAction.LOGIN_FAILED,
  [AuditKey.USER_PASSWORD_CHANGED]: AuditAction.PASSWORD_CHANGE,

  [AuditKey.PRODUCT_CREATED]: AuditAction.CREATE,
  [AuditKey.PRODUCT_UPDATED]: AuditAction.UPDATE,
  [AuditKey.PRODUCT_DELETED]: AuditAction.DELETE,

  [AuditKey.SETTINGS_UPDATED]: AuditAction.UPDATE,

  [AuditKey.DATA_EXPORTED]: AuditAction.EXPORT,
  [AuditKey.DATA_IMPORTED]: AuditAction.IMPORT,
  [AuditKey.CLEANUP_EXECUTED]: AuditAction.DELETE,
};
