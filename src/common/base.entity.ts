import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryKey({ type: 'uuid' })
  _id: string | ObjectId = v4();

  @ApiProperty({ description: 'ID as string' })
  get id(): string {
    return this._id instanceof ObjectId ? this._id.toHexString() : this._id;
  }

  @ApiProperty({ description: 'Creation timestamp' })
  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date;
}
