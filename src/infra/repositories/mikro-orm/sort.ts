export function Sort(sort: unknown): any {
  if (!sort) return undefined;

  if (typeof sort === 'object' && !Array.isArray(sort)) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(sort as Record<string, any>)) {
      res[k] = v === -1 || v === 'desc' ? 'desc' : 'asc';
    }
    return res;
  }

  return sort;
}
