import type { FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  QueryCondition,
  FilterRule,
} from '@/common/types/repository.types';
import { OperatorType } from '@/common/enums/operator-type.enum';

export type OperatorConditionHandler = (
  values: any,
) => Record<string, any> | undefined;

export const OPERATOR_STRATEGIES: Record<
  OperatorType,
  OperatorConditionHandler
> = {
  [OperatorType.EQUAL]: (values) => ({ $eq: values }),
  [OperatorType.NOT_EQUAL]: (values) => ({ $ne: values }),
  [OperatorType.INCLUDE]: (values) => ({ $in: values }),
  [OperatorType.EXCLUDE]: (values) => ({ $nin: values }),
  [OperatorType.LIKE]: (values) => ({ $like: `%${values}%` }),
  [OperatorType.I_LIKE]: (values) => ({ $ilike: `%${values}%` }),
  [OperatorType.GREATER_THAN]: (values) => ({ $gt: values }),
  [OperatorType.GREATER_THAN_OR_EQUAL]: (values) => ({ $gte: values }),
  [OperatorType.LESS_THAN]: (values) => ({ $lt: values }),
  [OperatorType.LESS_THAN_OR_EQUAL]: (values) => ({ $lte: values }),
  [OperatorType.BETWEEN]: (values: [any, any]) => ({
    $gte: values[0],
    $lte: values[1],
  }),
  [OperatorType.IS_NULL]: () => ({ $eq: null }),
  [OperatorType.IS_NOT_NULL]: () => ({ $ne: null }),
};

export function getOperatorCondition(
  operator: OperatorType,
  values: unknown,
): Record<string, any> | undefined {
  return OPERATOR_STRATEGIES[operator]?.(values);
}

export function parseFilterRules<E>(
  rules: FilterRule<E>[],
): Record<string, any> {
  const andConditions = rules.map(({ field, operator, values }) => ({
    [field as string]: OPERATOR_STRATEGIES[operator]?.(values),
  }));

  if (andConditions.length <= 1) return andConditions[0] ?? {};
  return { $and: andConditions };
}

/**
 * Chuẩn hóa điều kiện truy vấn và tự động áp dụng bộ lọc Soft Delete (deletedAt: null).
 */
export function Filter<E extends BaseEntity>(
  condition: QueryCondition<E> = {},
  options?: { softDelete?: boolean },
): FilterQuery<E> {
  const parsed: Record<string, any> = Array.isArray(condition)
    ? parseFilterRules(condition)
    : condition;

  if (options?.softDelete || 'deletedAt' in parsed) {
    return parsed as FilterQuery<E>;
  }

  return { ...parsed, deletedAt: null } as FilterQuery<E>;
}
