import { FindOptions } from '@mikro-orm/core';
import type {
  QueryOptions,
  PopulateInput,
  PopulateOptions,
} from '../../../common/types/repository.types';

type QueryBuildOptions<E> = QueryOptions & {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  limit?: number;
  offset?: number;
};

type BuiltPopulateNode = {
  field: string;
  fields?: string[];
  children?: BuiltPopulate;
  orderBy?: Record<string, 1 | -1>;
  limit?: number;
};

type BuiltPopulate = string[] | BuiltPopulateNode[];

export class OptionsBuilder {
  static build<E>(query?: QueryBuildOptions<E>): FindOptions<E> {
    if (!query) {
      return {};
    }

    const findOptions: Record<string, unknown> = {};

    if (query.select) {
      findOptions.fields = query.select;
    }

    if (query.populate) {
      findOptions.populate = this.buildPopulate(query.populate);
    }

    if (query.sort) {
      findOptions.orderBy = query.sort;
    }

    if (query.limit !== undefined) {
      findOptions.limit = query.limit;
    }

    if (query.offset !== undefined) {
      findOptions.offset = query.offset;
    }

    if (query.withDeleted) {
      findOptions.filters = false;
    }

    return findOptions as FindOptions<E>;
  }

  static buildPopulate(populate?: PopulateInput): BuiltPopulate | undefined {
    if (!populate || populate.length === 0) {
      return undefined;
    }

    if (this.isPopulateFieldList(populate)) {
      return populate;
    }

    return populate.map((item) => this.buildPopulateNode(item));
  }

  private static buildPopulateNode(
    populateOption: PopulateOptions,
  ): BuiltPopulateNode {
    const populateNode: BuiltPopulateNode = {
      field: populateOption.path,
    };

    if (populateOption.select) {
      populateNode.fields = populateOption.select;
    }

    if (populateOption.populate) {
      populateNode.children = this.buildPopulate(populateOption.populate);
    }

    if (populateOption.sort) {
      populateNode.orderBy = populateOption.sort;
    }

    if (populateOption.limit) {
      populateNode.limit = populateOption.limit;
    }

    return populateNode;
  }

  private static isPopulateFieldList(
    populate: PopulateInput,
  ): populate is string[] {
    return typeof populate[0] === 'string';
  }
}
