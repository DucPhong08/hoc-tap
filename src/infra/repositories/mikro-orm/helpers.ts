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

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
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
      const field = item.path || item.field;
      if (!field) continue;

      const currentPrefix = prefix ? `${prefix}.${field}` : field;

      const option: any = { field };
      const rawFilters = item.filters || item.where;
      if (rawFilters) {
        if (Array.isArray(rawFilters)) {
          option.where = parseFilterRules(rawFilters);
        } else {
          option.where = rawFilters;
        }
      }
      const rawSort = item.sort || item.orderBy;
      if (rawSort) option.orderBy = Sort(rawSort);
      if (item.limit) option.limit = item.limit;

      if (item.select) {
        extraFields.push(...parseFields(item.select, currentPrefix));
      }

      const nestedPop = item.population || item.populate;
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
  const {
    select,
    fields,
    populate,
    population,
    sort,
    limit,
    offset,
    orderBy,
    transaction,
    softDelete,
    page,
    filters,
    refresh,
    ...rest
  } = query;

  const rawSelect = select ?? fields ?? query.fields;
  const rawPopulation = population ?? populate ?? query.populate;

  const { populate: parsedPopulate, extraFields } =
    parsePopulation(rawPopulation);
  let parsedFields = parseFields(rawSelect);

  if (extraFields.length > 0) {
    if (parsedFields.length === 0) {
      parsedFields = extraFields;
    } else {
      parsedFields = [...parsedFields, ...extraFields];
    }
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
    const rawPopulate = options?.population || options?.populate;
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
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
