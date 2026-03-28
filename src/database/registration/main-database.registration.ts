import { DB_CONTEXTS } from '../database.constants';
import { AuditLogEntity } from '../../modules/audit-logs/entities/audit-log.entity';
import { SettingEntity } from '../../modules/settings/entities/setting.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { DatabaseContextDefinition } from '../types/database.types';

export const MAIN_DATABASE_CONTEXT: DatabaseContextDefinition = {
  contextName: DB_CONTEXTS.MAIN,
  entities: [UserEntity, SettingEntity, AuditLogEntity],
  defaultMigrationPath: 'mikro-base/migrations',
  defaultPoolMinSize: 2,
  defaultPoolMaxSize: 10,
  defaultTimezone: '+07:00',
};
