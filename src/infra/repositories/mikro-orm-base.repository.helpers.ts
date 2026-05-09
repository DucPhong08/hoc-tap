import type { FindOptions } from '@mikro-orm/core';
import type {
  FindQuery,
  QueryCondition,
  UpdateData,
} from '../../common/interfaces/repository.interface';
import { BaseEntity } from '../../common/entity/base.entity';
import { UPDATE_OPERATOR_KEYS } from './mikro-orm/update.helper';
import { isRecord } from './mikro-orm/utils';

export function hasUpdateOperators<E extends object>(
  data: UpdateData<E>,
): boolean {
  return isRecord(data) && UPDATE_OPERATOR_KEYS.some((op) => op in data);
}

export function buildUpsertPayload<E extends BaseEntity>(
  seed: Partial<E>,
  data: UpdateData<E>,
): Partial<E> {
  if (hasUpdateOperators(data)) {
    throw new Error('Upsert chỉ nhận plain data, không nhận update operators.');
  }
  return { ...seed, ...(data as Partial<E>) };
}

export function extractUpsertSeed<E extends BaseEntity>(
  condition: QueryCondition<E>,
): Partial<E> {
  if (!isRecord(condition)) {
    throw new Error('Upsert chỉ hỗ trợ object condition trong updateOne.');
  }

  const seed: Partial<E> = {};

  for (const [field, value] of Object.entries(condition)) {
    if (field.startsWith('$')) {
      throw new Error('Upsert không hỗ trợ logical operators trong condition.');
    }

    if (isRecord(value) && Object.keys(value).some((k) => k.startsWith('$'))) {
      // Chỉ cho phép { $eq: x } — unwrap value ra
      if ('$eq' in value && Object.keys(value).length === 1) {
        seed[field as keyof E] = value.$eq as E[keyof E];
        continue;
      }
      throw new Error('Upsert chỉ hỗ trợ equality condition trong updateOne.');
    }

    seed[field as keyof E] = value as E[keyof E];
  }

  return seed;
}

export function buildFindOptions<E extends BaseEntity>(
  query?: FindQuery<E>,
): FindOptions<E> {
  if (!query) return {};

  const options: Record<string, unknown> = {};

  if (query.select?.length) options.fields = query.select;
  if (query.populate) options.populate = query.populate;
  if (query.sort) options.orderBy = query.sort;
  if (query.limit !== undefined) options.limit = query.limit;
  if (query.offset !== undefined) options.offset = query.offset;
  if (query.withDeleted) options.filters = false;

  return options as FindOptions<E>;
}
