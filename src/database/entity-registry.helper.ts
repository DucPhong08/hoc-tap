import { InjectRepository } from '@mikro-orm/nestjs';
import { type AnyEntity, type EntityClass } from '@mikro-orm/core';
import { REGISTRY } from './entity-registry';
import { DB_CONTEXTS } from './database.constants';

export function findContext(entity: EntityClass<AnyEntity>): string {
  for (const [ctx, entities] of Object.entries(REGISTRY)) {
    if (entities.includes(entity)) return ctx;
  }
  return DB_CONTEXTS.MAIN;
}

export function getEntitiesByContext(ctx: string): EntityClass<AnyEntity>[] {
  return REGISTRY[ctx] ?? [];
}

export function InjectEntityRepository(
  entity: EntityClass<AnyEntity>,
): ParameterDecorator {
  return InjectRepository(entity, findContext(entity));
}
