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

function getOperatorCondition(operator: OperatorType, values: any): any {
  switch (operator) {
    case OperatorType.EQUAL:
      return { $eq: values };
    case OperatorType.NOT_EQUAL:
      return { $ne: values };
    case OperatorType.INCLUDE:
      return { $in: Array.isArray(values) ? values : [values] };
    case OperatorType.EXCLUDE:
      return { $nin: Array.isArray(values) ? values : [values] };
    case OperatorType.LIKE:
      return { $like: `%${escapeRegexValue(values)}%` };
    case OperatorType.I_LIKE:
      return { $ilike: `%${escapeRegexValue(values)}%` };
    case OperatorType.GREATER_THAN:
      return { $gt: values };
    case OperatorType.GREATER_THAN_OR_EQUAL:
      return { $gte: values };
    case OperatorType.LESS_THAN:
      return { $lt: values };
    case OperatorType.LESS_THAN_OR_EQUAL:
      return { $lte: values };
    case OperatorType.BETWEEN:
      return Array.isArray(values) && values.length === 2
        ? { $gte: values[0], $lte: values[1] }
        : undefined;
    case OperatorType.IS_NULL:
      return { $eq: null };
    case OperatorType.IS_NOT_NULL:
      return { $ne: null };
    default:
      return undefined;
  }
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
