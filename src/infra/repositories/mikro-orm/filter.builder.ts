import { FilterQuery } from '@mikro-orm/core';
import type { QueryCondition } from '../../../common/interfaces/query';

export interface FilterBuildOptions {
  withDeleted?: boolean;
}

const LOGICAL_OPERATORS = new Set(['$and', '$or', '$not']);
const OPERATOR_ALIASES: Record<string, string> = { $regex: '$re' };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
};

export class FilterBuilder {
  static build<E>(
    condition: QueryCondition<E>,
    options?: FilterBuildOptions,
  ): FilterQuery<E> {
    const source = (condition ?? {}) as Record<string, unknown>;
    const filter: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (LOGICAL_OPERATORS.has(key)) {
        if (Array.isArray(value)) {
          filter[key] = value.map((item) =>
            FilterBuilder.build(item as QueryCondition<E>, options),
          );
        } else {
          filter[key] = FilterBuilder.build(
            (value ?? {}) as QueryCondition<E>,
            options,
          );
        }
        continue;
      }

      if (!isPlainObject(value)) {
        filter[key] = value;
        continue;
      }

      const operators: Record<string, unknown> = {};
      for (const [rawOperator, operatorValue] of Object.entries(value)) {
        if (rawOperator === '$eq') {
          filter[key] = operatorValue;
          continue;
        }

        const normalizedOperator = OPERATOR_ALIASES[rawOperator] ?? rawOperator;
        operators[normalizedOperator] = operatorValue;
      }

      filter[key] = Object.keys(operators).length > 0 ? operators : value;
    }

    if (!options?.withDeleted) {
      filter.deletedAt = null;
    }

    return filter as FilterQuery<E>;
  }
}
