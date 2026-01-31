// Conditions
export type {
  ComparisonOperator,
  FieldCondition,
  WhereCondition,
  QueryCondition,
} from './conditions.interface';

// Options
export type {
  PopulateField,
  PopulateOptions,
  PopulateInput,
  BaseQueryOption,
  BaseCommandOption,
} from './options.interface';

// Queries
export type {
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CountQuery,
  ExistsQuery,
  CreateQuery,
  InsertManyQuery,
  UpdateByIdQuery,
  UpdateOneQuery,
  UpdateManyQuery,
  DeleteByIdQuery,
  DeleteOneQuery,
  DeleteManyQuery,
} from './queries.interface';

// Results
export type {
  PaginationResult,
  UpdateManyResult,
  DeleteManyResult,
} from './results.interface';

// Operators
export type { UpdateOperator, UpdateData } from './operators.interface';
