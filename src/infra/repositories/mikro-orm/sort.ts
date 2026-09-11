export function Sort(
  sort?: Record<string, any>,
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort) return undefined;

  const res: Record<string, 'asc' | 'desc'> = {};
  for (const [k, v] of Object.entries(sort)) {
    res[k] = v === -1 || v === 'desc' ? 'desc' : 'asc';
  }
  return res;
}
