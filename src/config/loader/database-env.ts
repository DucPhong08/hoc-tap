import { merge, set } from 'lodash';
import { ConfigObject, ConfigValue, RawConfig, DatabaseProfile } from './types';
import {
  DATABASE_FIELD_ALIASES,
  ENV_PREFIX,
  LEGACY_DATABASE_CONNECTION_FIELDS,
} from './constants';
import {
  ensureArray,
  ensureObject,
  getNestedValue,
  normalizeEnvValue,
  parseIntegerOrFallback,
  toCamelCase,
  setArrayValue,
} from './helpers';

function normalizeDatabaseDriver(
  rawDriver: string | null,
): 'postgresql' | 'mongodb' | 'mysql' | null {
  if (!rawDriver) {
    return null;
  }

  const normalizedDriver = rawDriver.toLowerCase();
  if (normalizedDriver === 'postgres' || normalizedDriver === 'postgresql') {
    return 'postgresql';
  }

  if (normalizedDriver === 'mongo' || normalizedDriver === 'mongodb') {
    return 'mongodb';
  }

  if (normalizedDriver === 'mysql') {
    return 'mysql';
  }

  return null;
}

function normalizeDatabaseProfile(rawProfile: unknown): DatabaseProfile | null {
  if (typeof rawProfile !== 'string') {
    return null;
  }

  const normalizedProfile = rawProfile.trim().toLowerCase();
  if (normalizedProfile === 'sql') {
    return 'sql';
  }

  if (normalizedProfile === 'mongo' || normalizedProfile === 'mongodb') {
    return 'mongo';
  }

  return null;
}

function buildSqlProfileConfig(
  environmentVariables: Record<string, string | undefined>,
): ConfigObject | null {
  const rawDriver = normalizeEnvValue(environmentVariables.SQL_TYPE);
  const host = normalizeEnvValue(environmentVariables.SQL_HOST);
  const port = normalizeEnvValue(environmentVariables.SQL_PORT);
  const username = normalizeEnvValue(environmentVariables.SQL_USER);
  const password = normalizeEnvValue(environmentVariables.SQL_PASSWORD);
  const databaseName = normalizeEnvValue(environmentVariables.SQL_DB);
  const schemaName = normalizeEnvValue(environmentVariables.SQL_SCHEMA);
  const driver = normalizeDatabaseDriver(rawDriver);

  const hasSqlProfile = [
    driver,
    host,
    port,
    username,
    password,
    databaseName,
    schemaName,
  ].some((fieldValue) => fieldValue !== null);

  if (!hasSqlProfile) {
    return null;
  }

  const resolvedDriver = driver ?? 'postgresql';
  const defaultPort = resolvedDriver === 'mysql' ? 3306 : 5432;
  const connectionConfig: ConfigObject = {
    connection: resolvedDriver,
    host: host ?? 'localhost',
    port: parseIntegerOrFallback(port, defaultPort),
    database: databaseName ?? 'mydb',
  };

  if (username) {
    connectionConfig.user = username;
  }

  if (password) {
    connectionConfig.password = password;
  }

  const sqlProfileConfig: ConfigObject = { connection: connectionConfig };
  if (schemaName) {
    sqlProfileConfig.driverOptions = { schema: schemaName };
  }

  return sqlProfileConfig;
}

function buildMongoProfileConfig(
  environmentVariables: Record<string, string | undefined>,
): ConfigObject | null {
  const mongoUri = normalizeEnvValue(environmentVariables.DB_URI);
  if (!mongoUri) {
    return null;
  }

  try {
    const parsedUri = new URL(mongoUri);
    if (!['mongodb:', 'mongodb+srv:'].includes(parsedUri.protocol)) {
      return null;
    }

    const databaseName = parsedUri.pathname.replace(/^\/+/, '') || 'test';
    const connectionConfig: ConfigObject = {
      connection: 'mongodb',
      host: parsedUri.hostname || 'localhost',
      port: parseIntegerOrFallback(parsedUri.port || null, 27017),
      database: databaseName,
    };

    if (parsedUri.username) {
      connectionConfig.user = decodeURIComponent(parsedUri.username);
    }

    if (parsedUri.password) {
      connectionConfig.password = decodeURIComponent(parsedUri.password);
    }

    return {
      connection: connectionConfig,
      driverOptions: {
        clientUrl: mongoUri,
      },
    };
  } catch {
    return null;
  }
}

function getDatabaseProfilePreference(
  environmentVariables: Record<string, string | undefined>,
  contextName: string,
  configProfile?: ConfigValue,
): DatabaseProfile | null {
  const resolvedProfileFromConfig = normalizeDatabaseProfile(configProfile);
  if (resolvedProfileFromConfig) {
    return resolvedProfileFromConfig;
  }

  const rawProfileFromEnvironment = normalizeEnvValue(
    environmentVariables[
      `${ENV_PREFIX}DATABASES_${contextName.toUpperCase()}_PROFILE`
    ],
  );
  return normalizeDatabaseProfile(rawProfileFromEnvironment);
}

function toDatabaseField(pathParts: string[]): string {
  const normalizedParts = pathParts
    .filter(Boolean)
    .map((part) => part.toLowerCase().trim());

  if (normalizedParts.length === 0) {
    return '';
  }

  const compactKey = normalizedParts.join('');
  return (
    DATABASE_FIELD_ALIASES[compactKey] ?? toCamelCase(normalizedParts.join('_'))
  );
}

export function resolveDatabaseConfigPath(rawPath: string): string {
  const normalizedPathParts = rawPath
    .split('_')
    .filter(Boolean)
    .map((part) => part.toLowerCase().trim());

  if (normalizedPathParts.length === 0) {
    return rawPath.toLowerCase();
  }

  const [contextName, ...contextPathParts] = normalizedPathParts;
  if (contextPathParts.length === 0) {
    return contextName;
  }

  const rootSection = contextPathParts[0];

  if (rootSection === 'connection') {
    const field =
      LEGACY_DATABASE_CONNECTION_FIELDS[
        toDatabaseField(contextPathParts.slice(1))
      ] ?? toDatabaseField(contextPathParts.slice(1));
    return `${contextName}.connection.${field}`;
  }

  if (rootSection === 'dev') {
    return `${contextName}.dev.${toDatabaseField(contextPathParts.slice(1))}`;
  }

  if (rootSection === 'orm') {
    if (contextPathParts[1] === 'migrations') {
      return `${contextName}.orm.migrations.${toDatabaseField(contextPathParts.slice(2))}`;
    }
    return `${contextName}.orm.${toDatabaseField(contextPathParts.slice(1))}`;
  }

  if (rootSection === 'driveroptions') {
    return `${contextName}.driverOptions.${toDatabaseField(contextPathParts.slice(1))}`;
  }

  if (rootSection === 'driver' && contextPathParts[1] === 'options') {
    return `${contextName}.driverOptions.${toDatabaseField(contextPathParts.slice(2))}`;
  }

  if (rootSection === 'profile') {
    return `${contextName}.profile`;
  }

  const legacyField =
    LEGACY_DATABASE_CONNECTION_FIELDS[toDatabaseField(contextPathParts)] ??
    toDatabaseField(contextPathParts);
  return `${contextName}.connection.${legacyField}`;
}

export function applyDatabaseProfileFallbacks(
  targetConfig: RawConfig,
  environmentVariables: Record<string, string | undefined>,
): void {
  const databasesConfig = targetConfig.databases;
  if (
    !databasesConfig ||
    typeof databasesConfig !== 'object' ||
    Array.isArray(databasesConfig)
  ) {
    return;
  }

  const sqlProfileConfig = buildSqlProfileConfig(environmentVariables);
  const mongoProfileConfig = buildMongoProfileConfig(environmentVariables);

  for (const [contextName, databaseContextConfig] of Object.entries(
    databasesConfig,
  )) {
    if (
      !databaseContextConfig ||
      typeof databaseContextConfig !== 'object' ||
      Array.isArray(databaseContextConfig)
    ) {
      continue;
    }

    const databaseConfig = databaseContextConfig;
    const preferredProfile = getDatabaseProfilePreference(
      environmentVariables,
      contextName,
      databaseConfig.profile,
    );
    const fallbackProfileConfig =
      preferredProfile === 'mongo' ? mongoProfileConfig : sqlProfileConfig;

    if (!fallbackProfileConfig) {
      continue;
    }

    databaseConfig.connection = merge(
      {},
      fallbackProfileConfig.connection,
      databaseConfig.connection ?? {},
    ) as ConfigObject;

    if (fallbackProfileConfig.driverOptions) {
      databaseConfig.driverOptions = merge(
        {},
        fallbackProfileConfig.driverOptions,
        databaseConfig.driverOptions ?? {},
      ) as ConfigObject;
    }
  }
}

export function applyDatabaseEnv(
  targetConfig: RawConfig,
  environmentVariables: Record<string, string | undefined>,
): void {
  const prefixedEnvironmentKeys = Object.keys(environmentVariables).filter(
    (key) => key.startsWith(ENV_PREFIX),
  );

  for (const environmentKey of prefixedEnvironmentKeys) {
    const normalizedValue = normalizeEnvValue(
      environmentVariables[environmentKey],
    );
    if (normalizedValue === null) {
      continue;
    }

    const keyWithoutPrefix = environmentKey.replace(ENV_PREFIX, '');
    const separatorIndex = keyWithoutPrefix.indexOf('_');

    if (separatorIndex === -1) {
      targetConfig[keyWithoutPrefix.toLowerCase()] = normalizedValue;
      continue;
    }

    const topLevelKey = keyWithoutPrefix
      .substring(0, separatorIndex)
      .toLowerCase();
    const nestedKeyPath = keyWithoutPrefix.substring(separatorIndex + 1);
    const indexedArrayMatch = nestedKeyPath.match(/^(.+)_(\d+)$/);

    if (indexedArrayMatch) {
      const [, arrayPath, arrayIndexAsText] = indexedArrayMatch;
      const arrayIndex = parseInt(arrayIndexAsText, 10);
      const topLevelObject = ensureObject(targetConfig, topLevelKey);

      if (topLevelKey === 'databases') {
        const databasePath = resolveDatabaseConfigPath(arrayPath);
        const existingArray = getNestedValue(topLevelObject, databasePath);

        if (!existingArray || !Array.isArray(existingArray)) {
          setArrayValue(
            topLevelObject,
            databasePath.split('.'),
            arrayIndex,
            normalizedValue,
          );
        } else {
          existingArray[arrayIndex] = normalizedValue;
        }
      } else {
        const arrayKey = toCamelCase(arrayPath);
        const targetArray = ensureArray(topLevelObject, arrayKey);
        targetArray[arrayIndex] = normalizedValue;
      }

      continue;
    }

    const topLevelObject = ensureObject(targetConfig, topLevelKey);

    if (topLevelKey === 'databases') {
      const databasePath = resolveDatabaseConfigPath(nestedKeyPath);
      set(topLevelObject, databasePath, normalizedValue);
      continue;
    }

    topLevelObject[toCamelCase(nestedKeyPath)] = normalizedValue;
  }

  applyDatabaseProfileFallbacks(targetConfig, environmentVariables);
}
