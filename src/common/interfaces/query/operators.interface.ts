/**
 * Update Operators
 */
export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: Partial<Record<keyof E, number>>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: Partial<Record<keyof E, any>>;
  $pull?: Partial<Record<keyof E, any>>;
};

/**
 * Update Data - Can be partial entity or update operators
 */
export type UpdateData<E> = Partial<E> | UpdateOperator<E>;
