import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

const isMongo = !process.env.DB_MAIN_DRIVER?.toLowerCase().includes('postgres');

@Entity({ abstract: true })
export abstract class BaseEntity {
  @PrimaryKey({
    type: 'string',
    ...(isMongo ? { fieldName: '_id' } : {}),
    onCreate: () => uuidv4(),
  })
  id!: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true, default: null })
  deletedAt?: Date | null;
}
