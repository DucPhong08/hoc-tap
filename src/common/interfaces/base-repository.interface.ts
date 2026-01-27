import { BaseEntity } from '../base.entity';

export type QueryCondition<E = any> = {
  [P in keyof E]?: E[P] | { $in?: E[P][]; $ne?: E[P]; $gt?: E[P]; $lt?: E[P] };
} & {
  [key: string]: any;
};

export type UpdateDocument<E> =
  | Partial<E>
  | { $inc?: Partial<Record<keyof E, number>> };

export interface FindOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string[];
}

export interface BaseRepository<E extends BaseEntity> {
  create(data: Partial<E>): Promise<E>;

  getById(id: string): Promise<E | null>;

  getOne(conditions: QueryCondition<E>): Promise<E | null>;

  getMany(conditions?: QueryCondition<E>, options?: FindOptions): Promise<E[]>;

  getPage(
    conditions: QueryCondition<E>,
    page: number,
    limit: number,
  ): Promise<{ data: E[]; total: number; page: number; limit: number }>;

  updateById(id: string, update: UpdateDocument<E>): Promise<E | null>;

  updateOne(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<E | null>;

  updateMany(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<{ affected: number }>;

  deleteById(id: string): Promise<E | null>;

  deleteOne(conditions: QueryCondition<E>): Promise<E | null>;

  deleteMany(conditions: QueryCondition<E>): Promise<{ deleted: number }>;

  count(conditions?: QueryCondition<E>): Promise<number>;

  exists(conditions: QueryCondition<E>): Promise<boolean>;
}
