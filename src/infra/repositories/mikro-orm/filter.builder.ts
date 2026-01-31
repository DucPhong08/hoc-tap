import { FilterQuery } from '@mikro-orm/core';
import type { QueryCondition } from '../../../common/interfaces/query';

/**
 * Options for building filters
 */
export interface FilterBuildOptions {
  withDeleted?: boolean;
}

/**
 * Filter Builder - Converts QueryCondition to MikroORM FilterQuery
 */
export class FilterBuilder {
  /**
   * Build MikroORM FilterQuery from QueryCondition
   * @param condition - Query condition to convert
   * @param options - Optional build options (e.g., withDeleted)
   */
  static build<E>(
    condition: QueryCondition<E>,
    options?: FilterBuildOptions,
  ): FilterQuery<E> {
    const filter: any = {};

    for (const [key, value] of Object.entries(condition)) {
      // Handle logical operators
      if (key === '$and' || key === '$or' || key === '$not') {
        if (Array.isArray(value)) {
          filter[key] = value.map((c) => FilterBuilder.build(c, options));
        } else {
          filter[key] = FilterBuilder.build(value, options);
        }
        continue;
      }

      // Handle field conditions
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        const operators: any = {};

        for (const [op, val] of Object.entries(value)) {
          switch (op) {
            case '$eq':
              filter[key] = val;
              break;
            case '$ne':
              operators.$ne = val;
              break;
            case '$gt':
              operators.$gt = val;
              break;
            case '$gte':
              operators.$gte = val;
              break;
            case '$lt':
              operators.$lt = val;
              break;
            case '$lte':
              operators.$lte = val;
              break;
            case '$in':
              operators.$in = val;
              break;
            case '$nin':
              operators.$nin = val;
              break;
            case '$like':
              operators.$like = val;
              break;
            case '$ilike':
              operators.$ilike = val;
              break;
            case '$re':
            case '$regex':
              operators.$re = val;
              break;
            case '$exists':
              operators.$exists = val;
              break;
            default:
              operators[op] = val;
          }
        }

        if (Object.keys(operators).length > 0) {
          filter[key] = operators;
        }
      } else {
        // Direct value
        filter[key] = value;
      }
    }

    // Add soft delete filter: exclude deleted records unless withDeleted is true
    if (!options?.withDeleted) {
      filter.deletedAt = null;
    }

    return filter as FilterQuery<E>;
  }
}
