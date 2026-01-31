export type ComparisonOperator<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string | RegExp;
  $ilike?: string;
  $regex?: string | RegExp;
  $exists?: boolean;
  $not?: ComparisonOperator<T>;
};

export type FieldCondition<T> = T | ComparisonOperator<T>;

export type WhereCondition<E> = {
  [P in keyof E]?: FieldCondition<E[P]>;
} & {
  $and?: WhereCondition<E>[];
  $or?: WhereCondition<E>[];
  $not?: WhereCondition<E>;
};

export type QueryCondition<E> = WhereCondition<E>;
