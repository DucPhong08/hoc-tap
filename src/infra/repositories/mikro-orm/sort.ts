export function Sort(sort: unknown): unknown {
  if (!sort) return undefined;

  const resolveSortItem = (item: unknown): unknown => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        item as Record<string, unknown>,
      )) {
        if (val === -1 || val === '-1') {
          resolved[key] = 'desc';
        } else if (val === 1 || val === '1') {
          resolved[key] = 'asc';
        }
      }
      return resolved;
    }
    return item;
  };

  if (Array.isArray(sort)) {
    return sort.map(resolveSortItem);
  }
  return resolveSortItem(sort);
}
