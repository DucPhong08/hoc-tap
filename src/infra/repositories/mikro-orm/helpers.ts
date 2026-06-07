import {
  EntityManager,
  EntityRepository,
  type Populate,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entity/base.entity';
import { Sort } from './sort';
import { parseFilterRules } from './filter';

export function resolveContext<E extends BaseEntity>(
  entityManager: EntityManager,
  repository: EntityRepository<E>,
  options?: { transaction?: EntityManager },
): { em: EntityManager; repository: EntityRepository<E> } {
  const transaction = options?.transaction;
  return !transaction || transaction === entityManager
    ? { em: entityManager, repository }
    : {
        em: transaction,
        repository: transaction.getRepository(
          repository.getEntityName(),
        ) as unknown as EntityRepository<E>,
      };
}

export function parseFields(
  select?: string[] | Record<string, 1 | 0>,
  prefix = '',
): string[] {
  if (!select) return [];
  let fields: string[] = [];
  if (Array.isArray(select)) {
    fields = select;
  } else if (typeof select === 'object') {
    fields = Object.entries(select as Record<string, unknown>)
      .filter(([, v]) => v === 1 || v === '1' || v === true)
      .map(([k]) => k);
  }
  return prefix ? fields.map((f) => `${prefix}.${f}`) : fields;
}

export function parsePopulation(
  population?: any[],
  prefix = '',
): { populate: any[]; extraFields: string[] } {
  if (!population || !Array.isArray(population))
    return { populate: [], extraFields: [] };

  const populateOptions: any[] = [];
  const extraFields: string[] = [];

  for (const item of population) {
    if (typeof item === 'string') {
      populateOptions.push(item);
    } else if (item && typeof item === 'object') {
      const {
        path,
        filters,
        sort,
        limit,
        select,
        population: nestedPop,
      } = item;
      if (!path) continue;

      const currentPrefix = prefix ? `${prefix}.${path}` : path;
      const option: any = { field: path };

      if (filters) {
        option.where = Array.isArray(filters)
          ? parseFilterRules(filters)
          : filters;
      }
      if (sort) option.orderBy = Sort(sort);
      if (limit) option.limit = limit;

      if (select) {
        extraFields.push(...parseFields(select, currentPrefix));
      }

      if (nestedPop && Array.isArray(nestedPop)) {
        const { populate: children, extraFields: childFields } =
          parsePopulation(nestedPop, currentPrefix);
        if (children.length > 0) {
          option.children = children;
        }
        extraFields.push(...childFields);
      }

      populateOptions.push(option);
    }
  }

  return { populate: populateOptions, extraFields };
}

export function findOptions(query?: any): Record<string, any> {
  if (!query) return {};
  const { select, population, sort, limit, offset } = query;
  const rest = { ...query };
  delete rest.select;
  delete rest.population;
  delete rest.sort;
  delete rest.limit;
  delete rest.offset;
  delete rest.transaction;
  delete rest.softDelete;
  delete rest.refresh;

  const { populate: parsedPopulate, extraFields } = parsePopulation(population);
  let parsedFields = parseFields(select);

  if (extraFields.length > 0) {
    parsedFields =
      parsedFields.length === 0
        ? extraFields
        : [...parsedFields, ...extraFields];
  }

  const raw = {
    fields: parsedFields.length > 0 ? parsedFields : undefined,
    populate: parsedPopulate.length > 0 ? parsedPopulate : undefined,
    orderBy: Sort(sort),
    limit,
    offset,
    ...rest,
  };
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined),
  );
}

export async function populateEntity<E extends BaseEntity>(
  entityManager: EntityManager,
  entity: E | null,
  options?: any,
): Promise<E | null> {
  if (entity) {
    const rawPopulate = options?.population;
    if (rawPopulate) {
      const { populate } = parsePopulation(rawPopulate);
      if (populate.length > 0) {
        await entityManager.populate(
          entity,
          populate as unknown as Populate<E>,
        );
      }
    }
    if (options?.refresh) await entityManager.refresh(entity);
  }
  return entity;
}
