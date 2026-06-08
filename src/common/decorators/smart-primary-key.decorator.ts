import { PrimaryKey, PrimaryKeyOptions } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 as uuidv4 } from 'uuid';

export function SmartPrimaryKey(options: PrimaryKeyOptions<any> = {}) {
  const driver = process.env.DB_MAIN_DRIVER || 'mongodb';

  if (!driver.toLowerCase().includes('mongo')) {
    return PrimaryKey({
      type: 'uuid',
      onCreate: () => uuidv4(),
      ...options,
    });
  }

  return PrimaryKey({
    type: 'ObjectId',
    fieldName: '_id',
    onCreate: () => new ObjectId().toString(),
    ...options,
  });
}
