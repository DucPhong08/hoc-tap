import type { FindOptions } from '@mikro-orm/core';
import type {
  FindQuery,
  QueryCondition,
  UpdateData,
} from '../../common/interfaces/repository.interface';
import { BaseEntity } from '../../common/entity/base.entity';
import { UPDATE_OPERATOR_KEYS } from './mikro-orm/update.helper';

const LOGICAL_OPERATOR_KEYS = new Set(['$and', '$or', '$not']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

export function hasUpdateOperators<E extends object>(
  data: UpdateData<E>,
): data is Record<string, unknown> {
  return (
    isRecord(data) &&
    Array.from(UPDATE_OPERATOR_KEYS).some((operator) => operator in data)
  );
}

export function buildUpsertPayload<E extends BaseEntity>(
  seed: Partial<E>,
  data: UpdateData<E>,
): Partial<E> {
  if (hasUpdateOperators(data)) {
    throw new Error(
      'Upsert only supports plain partial data. Use update operators without upsert.',
    );
  }

  return Object.assign({}, seed, data as Partial<E>);
}

export function extractUpsertSeed<E extends BaseEntity>(
  condition: QueryCondition<E>,
): Partial<E> {
  if (!isRecord(condition)) {
    throw new Error(
      'Upsert only supports object equality conditions in updateOne.',
    );
  }

  const seed: Partial<E> = {};

  for (const [fieldName, value] of Object.entries(condition)) {
    if (LOGICAL_OPERATOR_KEYS.has(fieldName)) {
      throw new Error(
        'Upsert only supports direct equality conditions in updateOne.',
      );
    }

    if (isRecord(value)) {
      if ('$eq' in value) {
        seed[fieldName as keyof E] = value.$eq as E[keyof E];
        continue;
      }

      if (Object.keys(value).some((key) => key.startsWith('$'))) {
        throw new Error(
          'Upsert only supports direct equality conditions in updateOne.',
        );
      }
    }

    seed[fieldName as keyof E] = value as E[keyof E];
  }

  return seed;
}

export function buildFindOptions<E extends BaseEntity>(
  query?: FindQuery<E>,
): FindOptions<E> {
  if (!query) {
    return {};
  }

  const findOptions: Record<string, unknown> = {};

  if (query.select?.length) {
    findOptions.fields = query.select;
  }

  if (query.populate) {
    findOptions.populate = query.populate;
  }

  if (query.sort) {
    findOptions.orderBy = query.sort;
  }

  if (query.limit !== undefined) {
    findOptions.limit = query.limit;
  }

  if (query.offset !== undefined) {
    findOptions.offset = query.offset;
  }

  if (query.withDeleted) {
    findOptions.filters = false;
  }

  return findOptions as FindOptions<E>;
}
