import { FilterQuery } from '@mikro-orm/core';
import type { QueryCondition } from '../../../common/interfaces/repository.interface';

const SOFT_DELETE_FIELD = 'deletedAt';
const REGEX_OPERATOR = '$re';

type FilterRecord = Record<string, unknown>;

const LOGICAL_OPERATORS = new Set(['$and', '$or', '$not']);

export interface FilterBuildOptions {
  withDeleted?: boolean;
}

export class FilterBuilder {
  static build<E>(
    condition: QueryCondition<E>,
    options?: FilterBuildOptions,
  ): FilterQuery<E> {
    const filter = this.normalize(condition);

    if (!options?.withDeleted && this.isRecord(filter)) {
      filter[SOFT_DELETE_FIELD] = null;
    }

    return filter as FilterQuery<E>;
  }

  private static normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    const keys = Object.keys(value);
    const hasOperatorKeys = keys.some((key) => key.startsWith('$'));
    const hasLogicalOperator = keys.some((key) => LOGICAL_OPERATORS.has(key));

    if (hasOperatorKeys && !hasLogicalOperator) {
      if ('$eq' in value && keys.length === 1) {
        return this.normalize(value.$eq);
      }

      const operators: FilterRecord = {};

      for (const [operator, operatorValue] of Object.entries(value)) {
        if (operator === '$eq') {
          continue;
        }

        operators[operator === '$regex' ? REGEX_OPERATOR : operator] =
          this.normalize(operatorValue);
      }

      return operators;
    }

    const filter: FilterRecord = {};

    for (const [fieldName, fieldValue] of Object.entries(value)) {
      filter[fieldName] = this.normalize(fieldValue);
    }

    return filter;
  }

  private static isRecord(value: unknown): value is FilterRecord {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    );
  }
}
