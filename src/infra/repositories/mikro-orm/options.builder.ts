import { FindOptions } from '@mikro-orm/core';
import type { PopulateOptions } from '../../../common/interfaces/query';

/**
 * Options Builder - Converts Query options to MikroORM FindOptions
 */
export class OptionsBuilder {
  /**
   * Build MikroORM FindOptions from Query
   */
  static build<E>(query?: any): FindOptions<E> {
    if (!query) return {};

    const findOptions: FindOptions<E> = {};

    // Select fields
    if (query.select) {
      findOptions.fields = query.select;
    }

    // Populate (JOIN)
    if (query.populate) {
      findOptions.populate = OptionsBuilder.buildPopulate(query.populate);
    }

    // Sort
    if (query.sort) {
      findOptions.orderBy = query.sort;
    }

    // Limit
    if (query.limit !== undefined) {
      findOptions.limit = query.limit;
    }

    // Offset
    if (query.offset !== undefined) {
      findOptions.offset = query.offset;
    }

    // Soft delete filter
    if (query.withDeleted === true) {
      findOptions.filters = false as any;
    }

    return findOptions;
  }

  /**
   * Build populate array from PopulateInput
   */
  static buildPopulate(populate: any): any {
    if (!populate) return undefined;

    // Simple array: ['user', 'items.product']
    if (Array.isArray(populate)) {
      // Check if it's array of strings or PopulateOptions
      if (populate.length === 0) return undefined;

      if (typeof populate[0] === 'string') {
        return populate;
      }

      // Array of PopulateOptions
      return populate.map((p: PopulateOptions) => {
        const result: any = { field: p.path };

        if (p.select) {
          result.fields = p.select;
        }

        if (p.populate) {
          result.children = OptionsBuilder.buildPopulate(p.populate);
        }

        if (p.sort) {
          result.orderBy = p.sort;
        }

        if (p.limit) {
          result.limit = p.limit;
        }

        return result;
      });
    }

    return populate;
  }
}
