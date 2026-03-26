import { FilterQuery } from '@mikro-orm/core';
import type { QueryCondition } from '../../../common/interfaces/query';

const SOFT_DELETE_FIELD = 'deletedAt';
const REGEX_OPERATOR = '$re';

type LogicalOperator = '$and' | '$or' | '$not';
type FilterRecord = Record<string, unknown>;

const LOGICAL_OPERATORS = new Set<LogicalOperator>(['$and', '$or', '$not']);

export interface FilterBuildOptions {
  withDeleted?: boolean;
}

export class FilterBuilder {
  static build<E>(
    condition: QueryCondition<E>,
    options?: FilterBuildOptions,
  ): FilterQuery<E> {
    const filter = this.buildCondition(condition, options);

    if (!options?.withDeleted) {
      filter[SOFT_DELETE_FIELD] = null;
    }

    return filter as FilterQuery<E>;
  }

  private static buildCondition<E>(
    condition: QueryCondition<E>,
    options?: FilterBuildOptions,
  ): FilterRecord {
    const filter: FilterRecord = {};

    for (const [fieldName, value] of Object.entries(condition)) {
      filter[fieldName] = this.isLogicalOperator(fieldName)
        ? this.buildLogicalCondition(value, options)
        : this.buildFieldCondition(value);
    }

    return filter;
  }

  private static buildLogicalCondition<E>(
    value: unknown,
    options?: FilterBuildOptions,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((item) =>
        this.build(item as QueryCondition<E>, options),
      );
    }

    if (this.isOperatorObject(value)) {
      return this.build(value as QueryCondition<E>, options);
    }

    return value;
  }

  private static buildFieldCondition(value: unknown): unknown {
    if (!this.isOperatorObject(value)) {
      return value;
    }

    const operators = this.buildOperators(value);
    if (Object.keys(operators).length > 0) {
      return operators;
    }

    if ('$eq' in value) {
      return value.$eq;
    }

    return value;
  }

  private static buildOperators(value: FilterRecord): FilterRecord {
    const operators: FilterRecord = {};

    for (const [operator, operatorValue] of Object.entries(value)) {
      if (operator === '$eq') {
        continue;
      }

      operators[this.normalizeOperator(operator)] = operatorValue;
    }

    return operators;
  }

  private static normalizeOperator(operator: string): string {
    return operator === '$regex' ? REGEX_OPERATOR : operator;
  }

  private static isLogicalOperator(value: string): value is LogicalOperator {
    return LOGICAL_OPERATORS.has(value as LogicalOperator);
  }

  private static isOperatorObject(value: unknown): value is FilterRecord {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    );
  }
}
