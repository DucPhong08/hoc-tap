import {
  EntityManager,
  EntityRepository,
  type FindOptions,
  type Populate as PopulateHint,
} from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import { Sort } from './sort';
import { Where } from './filter';
import type {
  PopulationQuery,
  FindQuery,
} from '@/common/types/repository.types';

/** em + repository theo transaction đang mở (nếu có). */
export const Context = <E extends BaseEntity>(
  em: EntityManager,
  repo: EntityRepository<E>,
  opts?: { transaction?: EntityManager },
): { em: EntityManager; repository: EntityRepository<E> } => {
  const tx = opts?.transaction;
  if (!tx || tx === em) return { em, repository: repo };

  return {
    em: tx,
    repository: tx.getRepository(
      repo.getEntityName(),
    ) as unknown as EntityRepository<E>,
  };
};

export const Fields = (
  select?: Partial<Record<string, 1 | 0>>,
  prefix = '',
): string[] => {
  if (!select) return [];

  const fields = Object.keys(select).filter((key) => select[key]);
  return prefix ? fields.map((field) => `${prefix}.${field}`) : fields;
};

export function Population(
  population?: PopulationQuery<any>[],
  prefix = '',
): { populate: unknown[]; fields: string[] } {
  if (!population?.length) return { populate: [], fields: [] };

  const populate: unknown[] = [];
  const fields: string[] = [];

  for (const item of population) {
    const { path, filters, sort, limit, select, population: nested } = item;
    const currentPrefix = prefix ? `${prefix}.${path}` : path;
    const option: Record<string, any> = { field: path };

    if (filters?.length) option.where = Where(filters);
    if (sort) option.orderBy = Sort(sort);
    if (limit) option.limit = limit;
    if (select) fields.push(...Fields(select, currentPrefix));

    if (nested?.length) {
      const child = Population(nested, currentPrefix);
      if (child.populate.length) option.children = child.populate;
      fields.push(...child.fields);
    }

    populate.push(option);
  }

  return { populate, fields };
}

export function findOptions<E extends object>(
  query?: FindQuery<E>,
): FindOptions<E> {
  if (!query) return {};

  const options: FindOptions<E> = {};
  const { populate, fields } = Population(query.population);
  const select = [...Fields(query.select), ...fields];
  const orderBy = Sort(query.sort);

  if (populate.length)
    options.populate = populate as unknown as PopulateHint<E>;
  if (select.length)
    options.fields = select as unknown as FindOptions<E>['fields'];
  if (orderBy) options.orderBy = orderBy as FindOptions<E>['orderBy'];
  if (query.limit) options.limit = query.limit;
  if (query.offset != null) options.offset = query.offset;

  return options;
}

export async function populateEntity<E extends BaseEntity>(
  em: EntityManager,
  entity: E,
  query?: FindQuery<E, EntityManager>,
): Promise<E> {
  const { populate } = Population(query?.population);

  if (populate.length) {
    await em.populate(entity, populate as unknown as PopulateHint<E>);
  }

  return entity;
}
