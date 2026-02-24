import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entity/base.entity';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';

@Entity({ tableName: 'users' })
export class UserModel extends BaseEntity {
  @Property({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Property({ type: 'varchar', length: 150 })
  firstName!: string;

  @Property({ type: 'varchar', length: 150 })
  lastName!: string;

  @Property({ type: 'text', nullable: true })
  password?: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Property({ type: 'json', default: ['user'] })
  roles: string[] = ['user'];

  @Property({ type: 'varchar', default: AuthProvider.LOCAL })
  provider: AuthProvider = AuthProvider.LOCAL;

  @Property({ type: 'varchar', nullable: true })
  providerId?: string;

  @Property({ type: 'varchar', nullable: true })
  avatar?: string;
}
