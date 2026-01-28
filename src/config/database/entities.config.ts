import { Type } from '@nestjs/common';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { ProductEntity } from '../../modules/products/entities/product.entity';

export const DB_CONTEXTS = {
  MAIN: 'main',
  ANALYTICS: 'analytics',
  LOGS: 'logs',
} as const;

export type DbContext = (typeof DB_CONTEXTS)[keyof typeof DB_CONTEXTS];

export const MAIN_ENTITIES: Type[] = [UserEntity, ProductEntity];

export const ANALYTICS_ENTITIES: Type[] = [];

export const LOGS_ENTITIES: Type[] = [];

export function getEntitiesByContext(context: DbContext): Type[] {
  switch (context) {
    case DB_CONTEXTS.MAIN:
      return MAIN_ENTITIES;
    case DB_CONTEXTS.ANALYTICS:
      return ANALYTICS_ENTITIES;
    case DB_CONTEXTS.LOGS:
      return LOGS_ENTITIES;
    default:
      return MAIN_ENTITIES;
  }
}
