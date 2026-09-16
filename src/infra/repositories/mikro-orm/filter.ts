import type { FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  QueryCondition,
  FilterRule,
} from '@/common/types/repository.types';
import { OperatorType } from '@/common/enums/operator-type.enum';

type OperatorHandler = (values: any) => Record<string, any>;

export const OPERATORS: Record<OperatorType, OperatorHandler> = {
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

/** FilterRule[] -> where object. */
export function Where<E>(rules: FilterRule<E>[]): Record<string, any> {
  const conditions: Record<string, any>[] = [];

  for (const { field, operator, values } of rules) {
    const condition = OPERATORS[operator]?.(values);
    if (condition) conditions.push({ [field as string]: condition });
  }

  if (conditions.length <= 1) return conditions[0] ?? {};
  return { $and: conditions };
}

/**
 * Chuẩn hóa điều kiện truy vấn và tự động áp dụng bộ lọc Soft Delete (deletedAt: null).
 */
export function Filter<E extends BaseEntity>(
  condition: QueryCondition<E> = {},
  options?: { softDelete?: boolean },
): FilterQuery<E> {
  const isRules = Array.isArray(condition);
  const where: Record<string, any> = isRules ? Where(condition) : condition;

  const hasDeletedAt = isRules
    ? condition.some((rule) => rule.field === 'deletedAt')
    : 'deletedAt' in where;

  if (options?.softDelete || hasDeletedAt) return where as FilterQuery<E>;

  return { ...where, deletedAt: null } as FilterQuery<E>;
}
