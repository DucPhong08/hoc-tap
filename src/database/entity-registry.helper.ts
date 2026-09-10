import { InjectRepository, MikroOrmModule } from '@mikro-orm/nestjs';
import { type AnyEntity, type EntityClass } from '@mikro-orm/core';
import { REGISTRY } from './entity-registry';
import { DynamicModule } from '@nestjs/common';

function findContext(entity: EntityClass<AnyEntity>): string {
  for (const [ctx, entities] of Object.entries(REGISTRY)) {
    if (entities.includes(entity)) return ctx;
  }
  throw new Error(`Entity "${entity.name}" not registered in entity-registry.`);
}

export function getEntitiesByContext(ctx: string): EntityClass<AnyEntity>[] {
  return REGISTRY[ctx] ?? [];
}

export function InjectEntityRepository(
  entity: EntityClass<AnyEntity>,
): ParameterDecorator {
  return InjectRepository(entity, findContext(entity));
}

export function registerEntities(
  entities: EntityClass<AnyEntity>[],
): DynamicModule[] {
  const groups: Record<string, EntityClass<AnyEntity>[]> = {};
  for (const entity of entities) {
    (groups[findContext(entity)] ??= []).push(entity);
  }
  return Object.entries(groups).map(([contextName, ctxEntities]) =>
    MikroOrmModule.forFeature({ entities: ctxEntities, contextName }),
  );
}
