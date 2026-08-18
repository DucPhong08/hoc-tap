import { PrimaryKey, PrimaryKeyOptions } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export function SmartPrimaryKey(options: PrimaryKeyOptions<any> = {}) {
  const driver = process.env.DB_MAIN_DRIVER || 'mongodb';
  const isMongo = driver.toLowerCase().includes('mongo');

  return PrimaryKey({
    type: 'string',
    ...(isMongo ? { fieldName: '_id' } : {}),
    onCreate: () => uuidv4(),
    ...options,
  });
}
