type Mode = 'development' | 'production' | 'test';

export const str = (key: string): string | undefined =>
  process.env[key]?.trim() || undefined;

export const num = (key: string): number | undefined => {
  const value = str(key);
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Env ${key} không phải số hợp lệ: "${value}"`);
  }
  return parsed;
};

export const bool = (key: string): boolean | undefined => {
  const value = str(key)?.toLowerCase();
  return value === 'true' ? true : value === 'false' ? false : undefined;
};

export const required = (key: string): string => {
  const value = str(key);
  if (!value) throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`);
  return value;
};

export const mode = (): Mode => {
  const value = str('MODE') ?? str('NODE_ENV');
  return value === 'production' || value === 'test' ? value : 'development';
};

export const isProd = (): boolean => mode() === 'production';

/** Bắt buộc có ở production, có default ở dev. */
export const secret = (key: string, dev: string): string =>
  isProd() ? required(key) : (str(key) ?? dev);
