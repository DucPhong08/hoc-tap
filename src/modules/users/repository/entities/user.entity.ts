import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/base.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @Property({ type: 'varchar', length: 150 })
  email!: string;

  @Property({ type: 'varchar', length: 150 })
  firstName!: string;

  @Property({ type: 'varchar', length: 150 })
  lastName!: string;

  @Property({ type: 'text', nullable: true })
  password?: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;
}
