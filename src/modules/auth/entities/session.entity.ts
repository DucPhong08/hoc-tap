import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseEntity } from '@/common/entity/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity({ tableName: 'sessions' })
@Index({ properties: ['user', 'isRevoked'] })
@Index({ properties: ['refreshTokenHash'] })
export class SessionEntity extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ length: 128 })
  refreshTokenHash!: string;

  @Property({ length: 128, nullable: true })
  previousRefreshTokenHash?: string;

  @Property({ nullable: true })
  rotatedAt?: Date;

  @Property({ default: false })
  isRevoked: boolean = false;

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property()
  expiresAt!: Date;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property({ nullable: true })
  userAgent?: string;
}
