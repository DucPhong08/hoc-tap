import { Entity, Property } from '@mikro-orm/core';
import { SmartPrimaryKey } from '../decorators/smart-primary-key.decorator';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @SmartPrimaryKey()
  id!: string;

  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true, default: null })
  deletedAt?: Date | null;
}
