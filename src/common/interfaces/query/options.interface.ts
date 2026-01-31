/**
 * Populate (JOIN) Options
 */
export type PopulateField = string;

export type PopulateOptions = {
  path: string;
  select?: string[];
  populate?: PopulateField[] | PopulateOptions[];
  sort?: Record<string, 1 | -1>;
  limit?: number;
};

export type PopulateInput = PopulateField[] | PopulateOptions[];

/**
 * Base Query Option - For read operations
 */
export interface BaseQueryOption<T = unknown> {
  transaction?: T;
}

/**
 * Base Command Option - For write operations
 */
export interface BaseCommandOption<T = unknown> {
  transaction?: T;
  plain?: boolean; // Return plain object instead of entity
}
