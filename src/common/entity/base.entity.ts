import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { randomUUID } from 'node:crypto';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  _id: string | ObjectId = randomUUID();

  get id(): string {
    return this._id instanceof ObjectId ? this._id.toHexString() : this._id;
  }

  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true, default: null })
  deletedAt?: Date | null;
}
