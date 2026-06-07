import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entity/base.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ unique: true })
  code!: string;

  @Property({ nullable: true })
  description?: string;
}
