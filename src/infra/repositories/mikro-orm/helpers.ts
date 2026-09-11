import {
  EntityManager,
  EntityRepository,
  type Populate,
} from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import { Sort } from './sort';
import { parseFilterRules } from './filter';
import type {
  PopulationQuery,
  FindQuery,
} from '@/common/types/repository.types';

export const resolveContext = <E extends BaseEntity>(
  em: EntityManager,
  repo: EntityRepository<E>,
  opts?: { transaction?: EntityManager },
): { em: EntityManager; repository: EntityRepository<E> } => {
  const tx = opts?.transaction;
  return !tx || tx === em
    ? { em, repository: repo }
    : {
        em: tx,
        repository: tx.getRepository(
          repo.getEntityName(),
        ) as unknown as EntityRepository<E>,
      };
};

export const parseFields = (
  select?: string[] | Record<string, any>,
  prefix = '',
): string[] => {
  if (!select) return [];
  const fields = Array.isArray(select)
    ? select
    : Object.keys(select).filter((k) => select[k]);
  return prefix ? fields.map((f) => `${prefix}.${f}`) : fields;
};

export function parsePopulation(
  population?: PopulationQuery<any>[],
  prefix = '',
): { populate: unknown[]; extraFields: string[] } {
  if (!Array.isArray(population)) return { populate: [], extraFields: [] };

  const populate: unknown[] = [];
  const extraFields: string[] = [];

  for (const item of population) {
    if (typeof item === 'string') {
      populate.push(item);
    } else if (item?.path) {
      const {
        path,
        filters,
        sort,
        limit,
        select,
        population: nestedPop,
      } = item;
      const currPrefix = prefix ? `${prefix}.${path}` : path;
      const option: Record<string, any> = { field: path };

      if (filters)
        option.where = Array.isArray(filters)
          ? parseFilterRules(filters)
          : filters;
      if (sort) option.orderBy = Sort(sort);
      if (limit) option.limit = limit;
      if (select) extraFields.push(...parseFields(select, currPrefix));

      if (Array.isArray(nestedPop)) {
        const child = parsePopulation(nestedPop, currPrefix);
        if (child.populate.length) option.children = child.populate;
        extraFields.push(...child.extraFields);
      }
      populate.push(option);
    }
  }
  return { populate, extraFields };
}

export function findOptions(query?: FindQuery<any>): Record<string, any> {
  if (!query) return {};

  const options: Record<string, any> = {};

  if (query.population?.length) {
    const { populate, extraFields } = parsePopulation(query.population);
    if (populate.length) options.populate = populate;
    const fields = [...parseFields(query.select), ...extraFields];
    if (fields.length) options.fields = fields;
  } else if (query.select) {
    options.fields = parseFields(query.select);
  }

  if (query.sort) options.orderBy = Sort(query.sort);
  if (query.limit) options.limit = query.limit;

  return options;
}

export async function populateEntity<E extends BaseEntity>(
  em: EntityManager,
  entity: E | null,
  opts?: FindQuery<E, EntityManager>,
): Promise<E | null> {
  if (!entity || !opts?.population) return entity;
  const { populate } = parsePopulation(opts.population);
  if (populate.length) {
    await em.populate(entity, populate as unknown as Populate<E>);
  }
  return entity;
}
