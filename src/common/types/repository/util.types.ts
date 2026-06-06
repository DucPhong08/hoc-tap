type Prev = [never, 0, 1, 2, 3, 4];

export type Paths<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends Date | RegExp
    ? never
    : T extends { getItems(): infer U } // Xử lý MikroORM Collection
      ? Paths<U, D>
      : T extends Array<infer U> // Xử lý Array thông thường
        ? Paths<U, D>
        : T extends object
          ?
              | {
                  [K in keyof T & (string | number)]:
                    | `${K}`
                    | `${K}.${Paths<T[K], Prev[D]>}`;
                }[keyof T & (string | number)]
              | (string & {})
          : never;
