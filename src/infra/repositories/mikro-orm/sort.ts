function normalizeDirection(val: unknown): unknown {
  const normalized = typeof val === 'string' ? val.toLowerCase().trim() : val;
  if (normalized === -1 || normalized === '-1' || normalized === 'desc') {
    return 'desc';
  }
  if (normalized === 1 || normalized === '1' || normalized === 'asc') {
    return 'asc';
  }
  return val;
}

export function Sort(sort: unknown): unknown {
  if (!sort) return undefined;

  const resolveSortItem = (item: unknown): unknown => {
    if (typeof item !== 'object' || !item || Array.isArray(item)) return item;

    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
      if (val == null) continue;
      resolved[key] = normalizeDirection(val);
    }
    return resolved;
  };

  return Array.isArray(sort)
    ? sort.map(resolveSortItem)
    : resolveSortItem(sort);
}
