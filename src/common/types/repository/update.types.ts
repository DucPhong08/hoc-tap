export type NumericFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends number ? K : never]: number;
}>;

export type ArrayItem<T> =
  NonNullable<T> extends readonly (infer Item)[] ? Item : never;

export type ArrayFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends readonly unknown[]
    ? K
    : never]: ArrayItem<E[K]>;
}>;

export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: NumericFieldMap<E>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: ArrayFieldMap<E>;
  $pull?: ArrayFieldMap<E>;
};

export type UpdateData<E> = Partial<E> | UpdateOperator<E>;
