export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | ConfigObject;

export type ConfigObject = { [key: string]: ConfigValue };
export type RawConfig = ConfigObject;

export type DatabaseProfile = 'sql' | 'mongo';
