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
    const buildCondition = (input: QueryCondition<E>): FilterRecord => {
      const filter: FilterRecord = {};

      for (const [fieldName, value] of Object.entries(input)) {
        if (LOGICAL_OPERATORS.has(fieldName)) {
          if (Array.isArray(value)) {
            filter[fieldName] = value.map((item) =>
              buildCondition(item as QueryCondition<E>),
            );
            continue;
          }

          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            !(value instanceof Date)
          ) {
            filter[fieldName] = buildCondition(value as QueryCondition<E>);
            continue;
          }

          filter[fieldName] = value;
          continue;
        }

        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value) ||
          value instanceof Date
        ) {
          filter[fieldName] = value;
          continue;
        }

        const hasOperatorKeys = Object.keys(value).some((key) =>
          key.startsWith('$'),
        );

        if (!hasOperatorKeys) {
          filter[fieldName] = value;
          continue;
        }

        if ('$eq' in value) {
          filter[fieldName] = value.$eq;
          continue;
        }

        const operators: FilterRecord = {};

        for (const [operator, operatorValue] of Object.entries(value)) {
          if (operator === '$eq') {
            continue;
          }

          operators[operator === '$regex' ? REGEX_OPERATOR : operator] =
            operatorValue;
        }

        filter[fieldName] = operators;
      }

      return filter;
    };

    const filter = buildCondition(condition);

    if (!options?.withDeleted) {
      filter[SOFT_DELETE_FIELD] = null;
    }

    return filter as FilterQuery<E>;
  }
}
