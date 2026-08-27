import {
  EntityManager,
  EntityRepository,
  type Populate,
} from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import { Sort } from './sort';
import { parseFilterRules } from './filter';
import type { PopulationQuery } from '@/common/types/repository/populate.types';
import type {
  FindQuery,
  CommandOptions,
} from '@/common/types/repository/options.types';

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
    : Object.entries(select)
        .filter(([, v]) => v === 1 || v === '1' || v === true)
        .map(([k]) => k);
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
    const fields = parseFields(query.select);
    if (fields.length) options.fields = fields;
  }

  if (query.sort != null) {
    const orderBy = Sort(query.sort);
    if (orderBy != null) options.orderBy = orderBy;
  }

  if (query.limit != null) options.limit = query.limit;
  if (query.offset != null) options.offset = query.offset;

  return options;
}

export async function populateEntity<E extends BaseEntity>(
  em: EntityManager,
  entity: E | null,
  opts?: CommandOptions<EntityManager, E>,
): Promise<E | null> {
  if (!entity) return null;
  if (opts?.population) {
    const { populate } = parsePopulation(opts.population);
    if (populate.length)
      await em.populate(entity, populate as unknown as Populate<E>);
  }
  return entity;
}
