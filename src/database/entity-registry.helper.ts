import { InjectRepository } from '@mikro-orm/nestjs';
import { type AnyEntity, type EntityClass } from '@mikro-orm/core';
import { REGISTRY } from 'src/modules/mikro/entity-registry';

// =============================================================================
// Helpers
// =============================================================================

function findContext(entity: EntityClass<AnyEntity>): string {
  for (const [ctx, entities] of Object.entries(REGISTRY)) {
    if (entities.includes(entity)) return ctx;
  }
  throw new Error(`Entity "${entity.name}" not registered in entity-registry.`);
}

/** Lấy danh sách entities theo context — dùng cho MikroOrmDatabaseModule & DatabaseContextDefinition */
export function getEntitiesByContext(ctx: string): EntityClass<AnyEntity>[] {
  return REGISTRY[ctx] ?? [];
}

/** Dùng thay @InjectRepository(Entity, DB_CONTEXTS.XXX) — tự resolve context */
export function InjectEntityRepository(
  entity: EntityClass<AnyEntity>,
): ParameterDecorator {
  return InjectRepository(entity, findContext(entity));
}
