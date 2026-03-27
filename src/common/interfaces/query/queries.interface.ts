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

export interface CreateCommand {
  populate?: PopulateInput;
}

export interface InsertManyCommand {
  ordered?: boolean;
}

export interface UpdateByIdCommand {
  populate?: PopulateInput;
}

export interface UpdateOneCommand {
  populate?: PopulateInput;
}

export interface UpdateManyCommand {
  ordered?: boolean;
}

export interface DeleteByIdCommand {
  soft?: boolean;
}

export interface DeleteOneCommand {
  soft?: boolean;
}

export interface DeleteManyCommand {
  soft?: boolean;
}
