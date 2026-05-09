import type { FilterQuery } from '@mikro-orm/core';
import type { QueryCondition } from '../../../common/interfaces/repository.interface';
import { isRecord } from './utils';

const SOFT_DELETE_FIELD = 'deletedAt';

const LOGICAL_OPS = new Set(['$and', '$or', '$not']);

export function buildFilter<E>(
  condition: QueryCondition<E>,
  options?: { withDeleted?: boolean },
): FilterQuery<E> {
  const filter = normalize(condition) as Record<string, unknown>;

  if (!options?.withDeleted) {
    filter[SOFT_DELETE_FIELD] = null;
  }

  return filter as FilterQuery<E>;
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!isRecord(value)) return value;

  const keys = Object.keys(value);
  const isOperatorNode = keys.some((k) => k.startsWith('$'));

  if (!isOperatorNode) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  }

  if ('$eq' in value && keys.length === 1) {
    return normalize(value.$eq);
  }

  if (keys.some((k) => LOGICAL_OPS.has(k))) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([op]) => op !== '$eq')
      .map(([op, v]) => [op, normalize(v)]),
  );
}
