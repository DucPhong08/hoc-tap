export type NumericFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends number ? K : never]: number;
}>;

type IsArray<T> =
  NonNullable<T> extends readonly unknown[]
    ? true
    : NonNullable<T> extends { getItems(): unknown }
      ? true
      : false;

export type ArrayItem<T> =
  NonNullable<T> extends readonly (infer I)[]
    ? I
    : NonNullable<T> extends { getItems(): readonly (infer I)[] }
      ? I
      : never;

export type ArrayFieldMap<E> = Partial<{
  [K in keyof E as IsArray<E[K]> extends true ? K : never]:
    | ArrayItem<E[K]>
    | ArrayItem<E[K]>[];
}>;

export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: NumericFieldMap<E>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: ArrayFieldMap<E>;
  $pull?: ArrayFieldMap<E>;
};

export type UpdateData<E> = Partial<E> | UpdateOperator<E>;
