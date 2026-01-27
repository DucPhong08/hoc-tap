import { merge, set } from 'lodash';
import * as dotenv from 'dotenv';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RootConfig } from './root.config';

type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | ConfigObject;
type ConfigObject = { [key: string]: ConfigValue };
type RawConfig = ConfigObject;

const APP_PREFIX = 'BE' as const;
const ENV_PREFIX = `${APP_PREFIX}_` as const;

function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function ensureObject(obj: ConfigObject, key: string): ConfigObject {
  if (!obj[key] || typeof obj[key] !== 'object' || Array.isArray(obj[key])) {
    obj[key] = {};
  }
  return obj[key];
}

function ensureArray(obj: ConfigObject, key: string): ConfigValue[] {
  if (!obj[key] || !Array.isArray(obj[key])) {
    obj[key] = [];
  }
  return obj[key] as ConfigValue[];
}

function getNestedValue(
  obj: ConfigObject,
  path: string,
): ConfigValue | undefined {
  return path.split('.').reduce((current: ConfigValue | undefined, key) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return current[key];
    }
    return undefined;
  }, obj);
}

function setArrayValue(
  obj: ConfigObject,
  pathParts: string[],
  index: number,
  value: string | undefined | null,
): void {
  const arrayKey = pathParts.pop()!;

  if (pathParts.length > 0) {
    const parent = pathParts.reduce(
      (current, key) => ensureObject(current, key),
      obj,
    );
    const arr = ensureArray(parent, arrayKey);
    arr[index] = value ?? null;
  } else {
    const arr = ensureArray(obj, arrayKey);
    arr[index] = value ?? null;
  }
}

function loadEnvironment(env: Record<string, string | undefined>): RawConfig {
  const result: RawConfig = {};

  const envKeys = Object.keys(env).filter((key) => key.startsWith(ENV_PREFIX));

  for (const k of envKeys) {
    const value = env[k];
    const keyWithoutPrefix = k.replace(ENV_PREFIX, '');
    const firstUnderscoreIndex = keyWithoutPrefix.indexOf('_');

    if (firstUnderscoreIndex === -1) {
      result[keyWithoutPrefix.toLowerCase()] = value ?? null;
      continue;
    }

    const topLevel = keyWithoutPrefix
      .substring(0, firstUnderscoreIndex)
      .toLowerCase();
    const rest = keyWithoutPrefix.substring(firstUnderscoreIndex + 1);
    const arrayMatch = rest.match(/^(.+)_(\d+)$/);

    if (arrayMatch) {
      const [, arrayPath, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      const topLevelObj = ensureObject(result, topLevel);

      if (topLevel === 'databases') {
        const parts = arrayPath.split('_').map((part) => part.toLowerCase());
        const path = parts.join('.');
        const existing = getNestedValue(topLevelObj, path);

        if (!existing || !Array.isArray(existing)) {
          setArrayValue(topLevelObj, [...parts], index, value);
        } else {
          existing[index] = value ?? null;
        }
      } else {
        const arrayKey = toCamelCase(arrayPath);
        const arr = ensureArray(topLevelObj, arrayKey);
        arr[index] = value ?? null;
      }
    } else {
      const topLevelObj = ensureObject(result, topLevel);

      if (topLevel === 'databases') {
        const path = rest
          .split('_')
          .map((part) => part.toLowerCase())
          .join('.');
        set(topLevelObj, path, value);
      } else {
        topLevelObj[toCamelCase(rest)] = value ?? null;
      }
    }
  }

  return result;
}

export default (): RootConfig => {
  dotenv.config();

  const envConfig = loadEnvironment(process.env ?? {});
  const config = merge({}, envConfig);

  const validatedConfig = plainToInstance(RootConfig, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
};
