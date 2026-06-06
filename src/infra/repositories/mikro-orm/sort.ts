export function Sort(sort: unknown): unknown {
  if (!sort) return undefined;

  const resolveSortItem = (item: unknown): unknown => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        item as Record<string, unknown>,
      )) {
        const lowerVal = String(val).toLowerCase();
        if (val === -1 || val === '-1' || lowerVal === 'desc') {
          resolved[key] = 'desc';
        } else if (val === 1 || val === '1' || lowerVal === 'asc') {
          resolved[key] = 'asc';
        } else {
          resolved[key] = val;
        }
      }
      return resolved;
    } else if (typeof item === 'string') {
      if (item.startsWith('-')) {
        return { [item.slice(1)]: 'desc' };
      }
      return { [item]: 'asc' };
    }
    return item;
  };

  if (Array.isArray(sort)) {
    return sort.map(resolveSortItem);
  }
  return resolveSortItem(sort);
}
