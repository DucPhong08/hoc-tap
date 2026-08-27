import type {
  RepositoryConfig,
  RepositoryPopulateConfig,
} from '@/common/types/repository.types';

export function mergeMethodOptions<
  E extends object,
  O extends Record<string, any>,
>(
  config: RepositoryConfig<E> | undefined,
  methodName: keyof RepositoryPopulateConfig<E>,
  options?: O,
): O {
  const defaultPopulate = config?.populate?.[methodName];
  if (!defaultPopulate) return options as O;
  if (!options) return { population: defaultPopulate } as unknown as O;

  return {
    ...options,
    population: options.population ?? defaultPopulate,
  } as O;
}
