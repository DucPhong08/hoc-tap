import { ConfigObject, ConfigValue } from './types';

export function toCamelCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function normalizeEnvValue(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

export function parseIntegerOrFallback(
  value: string | null,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function ensureObject(
  sourceObject: ConfigObject,
  key: string,
): ConfigObject {
  if (
    !sourceObject[key] ||
    typeof sourceObject[key] !== 'object' ||
    Array.isArray(sourceObject[key])
  ) {
    sourceObject[key] = {};
  }

  return sourceObject[key];
}

export function ensureArray(
  sourceObject: ConfigObject,
  key: string,
): ConfigValue[] {
  if (!sourceObject[key] || !Array.isArray(sourceObject[key])) {
    sourceObject[key] = [];
  }

  return sourceObject[key] as ConfigValue[];
}

export function getNestedValue(
  sourceObject: ConfigObject,
  path: string,
): ConfigValue | undefined {
  return path
    .split('.')
    .reduce((currentValue: ConfigValue | undefined, key) => {
      if (
        currentValue &&
        typeof currentValue === 'object' &&
        !Array.isArray(currentValue)
      ) {
        return currentValue[key];
      }

      return undefined;
    }, sourceObject);
}

export function setArrayValue(
  sourceObject: ConfigObject,
  pathParts: string[],
  index: number,
  value: string | null,
): void {
  const arrayKey = pathParts.pop();
  if (!arrayKey) {
    return;
  }

  if (pathParts.length > 0) {
    const parentObject = pathParts.reduce(
      (currentObject, key) => ensureObject(currentObject, key),
      sourceObject,
    );
    const targetArray = ensureArray(parentObject, arrayKey);
    targetArray[index] = value;
    return;
  }

  const targetArray = ensureArray(sourceObject, arrayKey);
  targetArray[index] = value;
}
