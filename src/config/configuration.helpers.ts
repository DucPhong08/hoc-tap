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
  const normalizedValue = readStringValue(value)?.toLowerCase();
  return normalizedValue === 'true'
    ? true
    : normalizedValue === 'false'
      ? false
      : fallbackValue;
}
