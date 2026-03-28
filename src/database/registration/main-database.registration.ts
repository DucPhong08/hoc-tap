import { DB_CONTEXTS } from '../database.constants';
import { MainMigrations } from '../migrations/main.migrations';
import { AuditLogEntity } from '../../modules/audit-logs/entities/audit-log.entity';
import { SettingEntity } from '../../modules/settings/entities/setting.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { DatabaseContextDefinition } from '../types/database.types';

export const MAIN_DATABASE_CONTEXT: DatabaseContextDefinition = {
  contextName: DB_CONTEXTS.MAIN,
  entities: [UserEntity, SettingEntity, AuditLogEntity],
  migrationDefinitions: MainMigrations,
  defaultMigrationPath: 'dist/migrations',
  defaultMigrationTsPath: 'src/migrations',
  defaultPoolMinSize: 2,
  defaultPoolMaxSize: 10,
  defaultTimezone: '+07:00',
};
