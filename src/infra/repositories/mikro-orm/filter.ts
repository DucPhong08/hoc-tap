import type { FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  QueryCondition,
  FilterRule,
} from '@/common/types/repository.types';
import { OperatorType } from '@/common/enums/operator-type.enum';

export function parseFilterRules<E>(
  rules: FilterRule<E>[],
): Record<string, any> {
  const andConditions: any[] = [];

  for (const rule of rules) {
    const { field, operator, values } = rule;
    const f = Array.isArray(field) ? field.join('.') : String(field);
    let condition: any = undefined;

    switch (operator) {
      case OperatorType.EQUAL:
        condition = { $eq: values };
        break;
      case OperatorType.NOT_EQUAL:
        condition = { $ne: values };
        break;
      case OperatorType.INCLUDE:
        condition = { $in: Array.isArray(values) ? values : [values] };
        break;
      case OperatorType.EXCLUDE:
        condition = { $nin: Array.isArray(values) ? values : [values] };
        break;
      case OperatorType.LIKE:
        condition = { $like: `%${values}%` };
        break;
      case OperatorType.I_LIKE:
        condition = { $ilike: `%${values}%` };
        break;
      case OperatorType.GREATER_THAN:
        condition = { $gt: values };
        break;
      case OperatorType.GREATER_THAN_OR_EQUAL:
        condition = { $gte: values };
        break;
      case OperatorType.LESS_THAN:
        condition = { $lt: values };
        break;
      case OperatorType.LESS_THAN_OR_EQUAL:
        condition = { $lte: values };
        break;
      case OperatorType.BETWEEN:
        if (Array.isArray(values) && values.length === 2) {
          condition = { $gte: values[0], $lte: values[1] };
        }
        break;
      case OperatorType.IS_NULL:
        condition = { $eq: null };
        break;
      case OperatorType.IS_NOT_NULL:
        condition = { $ne: null };
        break;
    }

    if (condition !== undefined) {
      andConditions.push({ [f]: condition });
    }
  }

  if (andConditions.length === 0) return {};
  if (andConditions.length === 1) return andConditions[0];
  return { $and: andConditions };
}

/**
 * Chuẩn hóa điều kiện truy vấn và tự động áp dụng bộ lọc Soft Delete (deletedAt: null).
 * Hàm này đã được tối ưu hóa cấu trúc truy vấn (Query Flattening) để tối ưu hiệu năng DB:
 *
 * @example
 * // 1. Điều kiện rỗng:
 * Filter({}) -> { deletedAt: null }
 *
 * @example
 * // 2. Điều kiện phẳng (phổ biến nhất):
 * Filter({ id: '1' }) -> { id: '1', deletedAt: null }
 *
 * @example
 * // 3. Điều kiện phức tạp (chứa $and/$or):
 * Filter({ $or: [{ name: 'A' }, { age: 18 }] }) -> { $and: [{ $or: [...] }, { deletedAt: null }] }
 */
export function Filter<E extends BaseEntity>(
  condition: QueryCondition<E> = {},
  options?: { softDelete?: boolean },
): FilterQuery<E> {
  let parsedCondition: FilterQuery<E> = {};

  if (Array.isArray(condition)) {
    parsedCondition = parseFilterRules(
      condition as FilterRule<E>[],
    ) as FilterQuery<E>;
  } else {
    parsedCondition = condition as FilterQuery<E>;
  }

  if (options?.softDelete) return parsedCondition;

  const hasKeys = parsedCondition && Object.keys(parsedCondition).length > 0;
  if (!hasKeys) {
    return { deletedAt: null } as unknown as FilterQuery<E>;
  }

  if (
    parsedCondition &&
    typeof parsedCondition === 'object' &&
    !('$and' in parsedCondition) &&
    !('$or' in parsedCondition)
  ) {
    return {
      ...parsedCondition,
      deletedAt: null,
    } as unknown as FilterQuery<E>;
  }

  return {
    $and: [parsedCondition, { deletedAt: null }],
  } as unknown as FilterQuery<E>;
}
