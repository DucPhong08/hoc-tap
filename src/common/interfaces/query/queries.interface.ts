import { PopulateInput } from './options.interface';

export interface GetByIdQuery<E> {
  select?: (keyof E)[];
  populate?: PopulateInput;
  withDeleted?: boolean;
}

export interface GetOneQuery<E> {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  withDeleted?: boolean;
}

export interface GetManyQuery<E> {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
}

export interface GetPageQuery<E> {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  page: number;
  limit: number;
  withDeleted?: boolean;
}

export interface CountQuery {
  withDeleted?: boolean;
}

export interface ExistsQuery {
  withDeleted?: boolean;
}

export interface CreateQuery {
  populate?: PopulateInput;
}

export interface InsertManyQuery {
  ordered?: boolean;
}

export interface UpdateByIdQuery {
  populate?: PopulateInput;
}

export interface UpdateOneQuery {
  populate?: PopulateInput;
}

export interface UpdateManyQuery {
  ordered?: boolean;
}

export interface DeleteByIdQuery {
  soft?: boolean;
}

export interface DeleteOneQuery {
  soft?: boolean;
}

export interface DeleteManyQuery {
  soft?: boolean;
}
