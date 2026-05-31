import type { FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entity/base.entity';
import type { QueryCondition } from '../../../common/interfaces/repository.interface';

export function buildFilter<E extends BaseEntity>(
  condition: QueryCondition<E> = {},
  options?: { softDelete?: boolean },
): FilterQuery<E> {
  if (options?.softDelete) return condition;

  return {
    $and: [condition, { deletedAt: { $eq: null } }],
  } as FilterQuery<E>;
}
