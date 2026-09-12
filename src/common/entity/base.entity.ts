import { Entity, PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { IsOptional } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

const isMongo = !process.env.DB_MAIN_DRIVER?.toLowerCase().includes('postgres');

@Entity({ abstract: true })
export abstract class BaseEntity {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'deletedAt';

  @PrimaryKey({
    type: 'string',
    ...(isMongo ? { fieldName: '_id' } : {}),
    onCreate: () => uuidv4(),
  })
  id!: string;

  @Property({ onCreate: () => new Date() })
  @IsOptional()
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  @IsOptional()
  updatedAt: Date = new Date();

  @Property({ nullable: true, default: null })
  @IsOptional()
  deletedAt?: Date | null;
}
