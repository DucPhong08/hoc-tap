export function Sort(sort: unknown): unknown {
  if (!sort) return undefined;

  const resolveSortItem = (item: unknown): unknown => {
    if (typeof item !== 'object' || !item || Array.isArray(item)) return item;

    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
      if (val == null) continue;
      const lower = typeof val === 'string' ? val.toLowerCase().trim() : val;
      resolved[key] =
        lower === -1 || lower === '-1' || lower === 'desc'
          ? 'desc'
          : lower === 1 || lower === '1' || lower === 'asc'
            ? 'asc'
            : val;
    }
    return resolved;
  };

  return Array.isArray(sort)
    ? sort.map(resolveSortItem)
    : resolveSortItem(sort);
}
