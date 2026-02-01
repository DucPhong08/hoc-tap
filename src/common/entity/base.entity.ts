import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 as uuidv4 } from 'uuid';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  _id: string | ObjectId = uuidv4();

  get id(): string {
    return this._id instanceof ObjectId ? this._id.toHexString() : this._id;
  }

  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
