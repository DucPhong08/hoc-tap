type SortValue = 1 | -1 | 'asc' | 'desc';

export function Sort(
  sort?: Partial<Record<string, SortValue>>,
): Record<string, 'asc' | 'desc'> | undefined {
  const entries = Object.entries(sort ?? {}).filter(
    ([, value]) => value !== undefined,
  );
  if (!entries.length) return undefined;

  return Object.fromEntries(
    entries.map(([field, value]) => [
      field,
      value === -1 || value === 'desc' ? 'desc' : 'asc',
    ]),
  );
}
