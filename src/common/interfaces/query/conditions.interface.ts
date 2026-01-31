/**
 * Comparison Operators for Query Conditions
 */
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

/**
 * Field Condition - Can be direct value or comparison operator
 */
export type FieldCondition<T> = T | ComparisonOperator<T>;

/**
 * Where Condition with logical operators
 */
export type WhereCondition<E = any> = {
  [P in keyof E]?: FieldCondition<E[P]>;
} & {
  $and?: WhereCondition<E>[];
  $or?: WhereCondition<E>[];
  $not?: WhereCondition<E>;
  [key: string]: any;
};

/**
 * Query Condition - Alias for WhereCondition
 */
export type QueryCondition<E = any> = WhereCondition<E>;
