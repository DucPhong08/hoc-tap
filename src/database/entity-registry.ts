import { InjectRepository } from '@mikro-orm/nestjs';
import type { AnyEntity, EntityClass } from '@mikro-orm/core';
import { DB_CONTEXTS, type DbContext } from './database.constants';
import { User } from '@/modules/users/entities/user.entity';
import { Setting } from '@/modules/settings/entities/setting.entity';
import { AuditLog } from '@/modules/audit-logs/entities/audit-log.entity';
import { SessionEntity } from '@/modules/auth/entities/session.entity';
// PLOP: IMPORT_ENTITY

export const ENTITY_REGISTRY: Record<DbContext, EntityClass<AnyEntity>[]> = {
  [DB_CONTEXTS.MAIN]: [
    User,
    Setting,
    SessionEntity,
    // PLOP: ADD_MAIN_ENTITY
  ],
  [DB_CONTEXTS.LOGS]: [AuditLog],
};

const CONTEXT_BY_ENTITY = new Map<EntityClass<AnyEntity>, DbContext>(
  Object.entries(ENTITY_REGISTRY).flatMap(([ctx, entities]) =>
    entities.map((entity) => [entity, ctx as DbContext] as const),
  ),
);

export const entitiesOf = (ctx: DbContext): EntityClass<AnyEntity>[] =>
  ENTITY_REGISTRY[ctx] ?? [];

export const contextOf = (entity: EntityClass<AnyEntity>): DbContext =>
  CONTEXT_BY_ENTITY.get(entity) ?? DB_CONTEXTS.MAIN;

export function InjectEntityRepository(
  entity: EntityClass<AnyEntity>,
): ParameterDecorator {
  return InjectRepository(entity, contextOf(entity));
}
