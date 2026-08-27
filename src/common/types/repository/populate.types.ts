import type { Paths } from './util.types';
import type { FilterRule } from './filter.types';

type Target<E, P> = P extends keyof E ? NonNullable<E[P]> : any;

export interface PopulationOptions<
  E extends object,
  P extends Paths<E> = Paths<E>,
> {
  path: P;
  select?: Partial<Record<Paths<Target<E, P>>, 1 | 0>>;
  filters?: FilterRule<Target<E, P>>[];
  sort?: Partial<Record<Paths<Target<E, P>>, 1 | -1>>;
  limit?: number;
  population?: PopulationQuery<Target<E, P>>[];
}

export type PopulationQuery<E extends object> = {
  [P in Paths<E>]: PopulationOptions<E, P>;
}[Paths<E>];
