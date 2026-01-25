import { OrmModule } from './infra/orm.module';

export const contexts = {
  MAIN: 'main',
} as const;

export const dbModules = [OrmModule.register(contexts.MAIN)];
