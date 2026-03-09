import { FindOptions } from '@mikro-orm/core';
import type {
  PopulateInput,
  PopulateOptions,
} from '../../../common/interfaces/query';

type ReadQueryOptions<E> = {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
};

type BuiltPopulate = Array<
  | string
  | {
      field: string;
      fields?: string[];
      children?: BuiltPopulate;
      orderBy?: Record<string, 1 | -1>;
      limit?: number;
    }
>;

export class OptionsBuilder {
  static build<E>(query?: ReadQueryOptions<E>): FindOptions<E> {
    if (!query) {
      return {};
    }

    const findOptions: FindOptions<E> = {};

    if (query.select) {
      findOptions.fields = query.select as any;
    }

    const populate = OptionsBuilder.buildPopulate(query.populate);
    if (populate) {
      findOptions.populate = populate as any;
    }

    if (query.sort) {
      findOptions.orderBy = query.sort as any;
    }

    if (query.limit !== undefined) {
      findOptions.limit = query.limit;
    }

    if (query.offset !== undefined) {
      findOptions.offset = query.offset;
    }

    if (query.withDeleted) {
      findOptions.filters = false as any;
    }

    return findOptions;
  }

  static buildPopulate(populate?: PopulateInput): BuiltPopulate | undefined {
    if (!populate || populate.length === 0) {
      return undefined;
    }

    if (typeof populate[0] === 'string') {
      return populate as string[];
    }

    return (populate as PopulateOptions[]).map((item) => ({
      field: item.path,
      ...(item.select ? { fields: item.select } : {}),
      ...(item.populate
        ? { children: OptionsBuilder.buildPopulate(item.populate) }
        : {}),
      ...(item.sort ? { orderBy: item.sort } : {}),
      ...(item.limit !== undefined ? { limit: item.limit } : {}),
    }));
  }
}
