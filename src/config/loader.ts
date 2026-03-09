import { merge, set } from 'lodash';
import * as dotenv from 'dotenv';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RootConfig } from './root.config';
import { DatabaseConfig } from './root/database.config';

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
const DATABASE_SEGMENT_ALIASES: Record<string, string> = {
  automigrate: 'autoMigrate',
  autosyncschema: 'autoSyncSchema',
  pathts: 'pathTs',
  driveroptions: 'driverOptions',
};

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

function normalizeDatabasePath(path: string): string {
  const rawParts = path
    .split('_')
    .map((part) => part.toLowerCase())
    .filter(Boolean);

  if (rawParts.length === 0) {
    return path.toLowerCase();
  }

  const [context, ...segments] = rawParts;
  const normalized: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment === 'auto' && segments[i + 1] === 'migrate') {
      normalized.push('autoMigrate');
      i += 1;
      continue;
    }

    if (
      segment === 'auto' &&
      segments[i + 1] === 'sync' &&
      segments[i + 2] === 'schema'
    ) {
      normalized.push('autoSyncSchema');
      i += 2;
      continue;
    }

    if (segment === 'path' && segments[i + 1] === 'ts') {
      normalized.push('pathTs');
      i += 1;
      continue;
    }

    if (segment === 'driver' && segments[i + 1] === 'options') {
      normalized.push('driverOptions');
      i += 1;
      continue;
    }

    normalized.push(DATABASE_SEGMENT_ALIASES[segment] || segment);
  }

  return [context, ...normalized].join('.');
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
        const path = normalizeDatabasePath(arrayPath);
        const parts = path.split('.');
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
        const path = normalizeDatabasePath(rest);
        set(topLevelObj, path, value);
      } else if (topLevel === 'oauth') {
        const [provider, ...rawFieldParts] = rest
          .split('_')
          .map((part) => part.toLowerCase());

        if (provider && rawFieldParts.length > 0) {
          const providerConfig = ensureObject(topLevelObj, provider);
          providerConfig[toCamelCase(rawFieldParts.join('_'))] = value ?? null;
        } else {
          topLevelObj[toCamelCase(rest)] = value ?? null;
        }
      } else {
        topLevelObj[toCamelCase(rest)] = value ?? null;
      }
    }
  }

  // Load cache config (without BE_ prefix)
  if (env.CACHE_ENABLED !== undefined) {
    const cache = ensureObject(result, 'cache');
    cache.enabled = env.CACHE_ENABLED === 'true';
    cache.ttl = parseInt(env.CACHE_TTL || '300', 10);
    cache.prefix = env.CACHE_PREFIX || 'app';

    const redis = ensureObject(cache, 'redis');
    redis.host = env.REDIS_HOST || 'localhost';
    redis.port = parseInt(env.REDIS_PORT || '6379', 10);
    if (env.REDIS_PASSWORD) {
      redis.password = env.REDIS_PASSWORD;
    }
    redis.db = parseInt(env.REDIS_DB || '0', 10);
  }

  // Load cluster config (without BE_ prefix)
  if (env.CLUSTER_ENABLED !== undefined) {
    const cluster = ensureObject(result, 'cluster');
    cluster.enabled = env.CLUSTER_ENABLED === 'true';
    cluster.workers = parseInt(env.CLUSTER_WORKERS || '0', 10);
  }

  return result;
}

function validateDatabaseConfigs(databases?: Record<string, DatabaseConfig>) {
  if (!databases || Object.keys(databases).length === 0) {
    throw new Error('At least one database context must be configured');
  }

  Object.entries(databases).forEach(([contextName, databaseConfig]) => {
    const errors = validateSync(databaseConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new Error(
        `Invalid database config for "${contextName}": ${errors.toString()}`,
      );
    }
  });
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

  validateDatabaseConfigs(validatedConfig.databases);

  return validatedConfig;
};
