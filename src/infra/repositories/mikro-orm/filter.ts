import type { FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  QueryCondition,
  FilterRule,
} from '@/common/types/repository.types';
import { OperatorType } from '@/common/enums/operator-type.enum';

const escapeRegexValue = (value: unknown): string =>
  String(value)
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseFilterRules<E>(
  rules: FilterRule<E>[],
): Record<string, any> {
  const andConditions: Record<string, any>[] = [];

  for (const rule of rules) {
    const { field, operator, values } = rule;
    const f = Array.isArray(field) ? field.join('.') : String(field);
    const condition = getOperatorCondition(operator, values);

    if (condition) andConditions.push({ [f]: condition });
  }

  return andConditions.length === 0
    ? {}
    : andConditions.length === 1
      ? andConditions[0]
      : { $and: andConditions };
}

export type OperatorConditionHandler = (
  values: unknown,
) => Record<string, unknown> | undefined;

export const OPERATOR_STRATEGIES: Record<
  OperatorType,
  OperatorConditionHandler
> = {
  [OperatorType.EQUAL]: (values) => ({ $eq: values }),
  [OperatorType.NOT_EQUAL]: (values) => ({ $ne: values }),
  [OperatorType.INCLUDE]: (values) => ({
    $in: Array.isArray(values) ? values : [values],
  }),
  [OperatorType.EXCLUDE]: (values) => ({
    $nin: Array.isArray(values) ? values : [values],
  }),
  [OperatorType.LIKE]: (values) => ({
    $like: `%${escapeRegexValue(values)}%`,
  }),
  [OperatorType.I_LIKE]: (values) => ({
    $ilike: `%${escapeRegexValue(values)}%`,
  }),
  [OperatorType.GREATER_THAN]: (values) => ({ $gt: values }),
  [OperatorType.GREATER_THAN_OR_EQUAL]: (values) => ({ $gte: values }),
  [OperatorType.LESS_THAN]: (values) => ({ $lt: values }),
  [OperatorType.LESS_THAN_OR_EQUAL]: (values) => ({ $lte: values }),
  [OperatorType.BETWEEN]: (values) =>
    Array.isArray(values) && values.length === 2
      ? { $gte: values[0], $lte: values[1] }
      : undefined,
  [OperatorType.IS_NULL]: () => ({ $eq: null }),
  [OperatorType.IS_NOT_NULL]: () => ({ $ne: null }),
};

export function getOperatorCondition(
  operator: OperatorType,
  values: unknown,
): Record<string, unknown> | undefined {
  const handler = OPERATOR_STRATEGIES[operator];
  return handler ? handler(values) : undefined;
}

/**
 * Chuẩn hóa điều kiện truy vấn và tự động áp dụng bộ lọc Soft Delete (deletedAt: null).
 * Tối ưu hóa cấu trúc truy vấn (Query Flattening) để tối ưu hiệu năng DB.
 */
export function Filter<E extends BaseEntity>(
  condition: QueryCondition<E> = {},
  options?: { softDelete?: boolean },
): FilterQuery<E> {
  const parsedCondition = (
    Array.isArray(condition)
      ? parseFilterRules(condition as FilterRule<E>[])
      : condition
  ) as FilterQuery<E>;

  if (options?.softDelete) return parsedCondition;

  const hasKeys = Object.keys(parsedCondition ?? {}).length > 0;
  if (!hasKeys) return { deletedAt: null } as FilterQuery<E>;

  const isFlat =
    typeof parsedCondition === 'object' &&
    !('$and' in parsedCondition) &&
    !('$or' in parsedCondition);
  if (isFlat) {
    return (
      'deletedAt' in parsedCondition
        ? parsedCondition
        : { ...parsedCondition, deletedAt: null }
    ) as FilterQuery<E>;
  }

  return { $and: [parsedCondition, { deletedAt: null }] } as FilterQuery<E>;
}
