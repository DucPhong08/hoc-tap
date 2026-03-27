import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { merge } from 'lodash';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RootConfig } from './root.config';
import { DEFAULT_BCRYPT_ROUNDS } from './loader/constants';
import { RawConfig } from './loader/types';
import { applyDatabaseEnv } from './loader/database-env';
import { ensureObject } from './loader/helpers';

const packageMetadata: {
  name?: string;
  version?: string;
} = (() => {
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    );
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    const metadata = parsed as { name?: unknown; version?: unknown };
    return {
      name: typeof metadata.name === 'string' ? metadata.name : undefined,
      version:
        typeof metadata.version === 'string' ? metadata.version : undefined,
    };
  } catch {
    return {};
  }
})();

function loadEnvironment(
  environmentVariables: Record<string, string | undefined>,
): RawConfig {
  const config: RawConfig = {};

  applyDatabaseEnv(config, environmentVariables);

  if (environmentVariables.CACHE_ENABLED !== undefined) {
    const cache = ensureObject(config, 'cache');
    cache.enabled = environmentVariables.CACHE_ENABLED === 'true';
    cache.ttl = parseInt(environmentVariables.CACHE_TTL || '300', 10);
    cache.prefix = environmentVariables.CACHE_PREFIX || 'app';

    const redis = ensureObject(cache, 'redis');
    redis.host = environmentVariables.REDIS_HOST || 'localhost';
    redis.port = parseInt(environmentVariables.REDIS_PORT || '6379', 10);
    if (environmentVariables.REDIS_PASSWORD) {
      redis.password = environmentVariables.REDIS_PASSWORD;
    }
    redis.db = parseInt(environmentVariables.REDIS_DB || '0', 10);
  }

  return config;
}

export default (): RootConfig => {
  dotenv.config();

  const envConfig = loadEnvironment(process.env ?? {});
  const mergedConfig = merge(
    {},
    {
      app: {
        appName: packageMetadata.name ?? 'app',
        appVersion: packageMetadata.version ?? '0.0.1',
      },
      auth: {
        bcryptRounds: DEFAULT_BCRYPT_ROUNDS,
      },
    },
    envConfig,
  );

  const validatedConfig = plainToInstance(RootConfig, mergedConfig, {
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
