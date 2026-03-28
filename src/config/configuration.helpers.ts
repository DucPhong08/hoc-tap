type Environment = Record<string, string | undefined>;

export function readStringValue(value: string | undefined): string | undefined;
export function readStringValue(
  value: string | undefined,
  fallbackValue: string,
): string;
export function readStringValue(
  value: string | undefined,
  fallbackValue?: string,
): string | undefined {
  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const normalizedValue = value.trim();
  return normalizedValue || fallbackValue;
}

export function readNumberValue(
  value: string | undefined,
  fallbackValue: number,
): number {
  const normalizedValue = readStringValue(value);
  if (!normalizedValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

export function readBooleanValue(
  value: string | undefined,
  fallbackValue: boolean,
): boolean {
  const normalizedValue = readStringValue(value);
  if (!normalizedValue) {
    return fallbackValue;
  }

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  return fallbackValue;
}

export function readIndexedListValue(
  environment: Environment,
  indexedPrefix: string,
  directKey: string,
  fallbackValues: string[],
): string[] {
  const indexedValues = Object.keys(environment)
    .filter((key) => key.startsWith(indexedPrefix))
    .map((key) => {
      const indexText = key.slice(indexedPrefix.length);
      const index = Number.parseInt(indexText, 10);
      const rawValue = environment[key];

      return {
        index,
        value: typeof rawValue === 'string' ? rawValue.trim() : undefined,
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.index) &&
        typeof entry.value === 'string' &&
        entry.value.length > 0,
    )
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.value as string);

  if (indexedValues.length > 0) {
    return indexedValues;
  }

  const directValue = readStringValue(environment[directKey]);
  if (!directValue) {
    return fallbackValues;
  }

  return directValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
