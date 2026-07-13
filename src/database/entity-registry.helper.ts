import { InjectRepository, MikroOrmModule } from '@mikro-orm/nestjs';
import { type AnyEntity, type EntityClass } from '@mikro-orm/core';
import { REGISTRY } from '@/modules/mikro/entity-registry';
import { DynamicModule } from '@nestjs/common';

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

/** Đăng ký entities cục bộ theo module — tự động gom nhóm và resolve database context */
export function registerEntities(
  entities: EntityClass<AnyEntity>[],
): DynamicModule[] {
  const groups: Record<string, EntityClass<AnyEntity>[]> = {};
  for (const entity of entities) {
    const ctx = findContext(entity);
    if (!groups[ctx]) {
      groups[ctx] = [];
    }
    groups[ctx].push(entity);
  }

  return Object.entries(groups).map(([contextName, ctxEntities]) =>
    MikroOrmModule.forFeature({
      entities: ctxEntities,
      contextName,
    }),
  );
}
