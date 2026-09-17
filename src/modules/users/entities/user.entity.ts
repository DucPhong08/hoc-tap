import {
  Entity,
  Property,
  BeforeCreate,
  BeforeUpdate,
  OneToMany,
  Collection,
  type Opt,
} from '@mikro-orm/core';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '@/common/entity/base.entity';
import { Table } from '@/common/enums/entity.enum';
import { AuthProvider } from '@/modules/auth/enums/auth-provider.enum';
import { Role } from '@/common/constants/role.constant';
import type { SessionEntity } from '@/modules/auth/entities/session.entity';

@Entity({ tableName: Table.USER })
export class User extends BaseEntity {
  @IsEmail()
  @MaxLength(150)
  @Property({ unique: true })
  email!: string;

  @IsString()
  @MaxLength(150)
  @Property({})
  firstName!: string;

  @IsString()
  @MaxLength(150)
  @Property({})
  lastName!: string;

  @IsOptional()
  @IsString()
  @Exclude({ toPlainOnly: true })
  @Property({ nullable: true, hidden: true })
  password?: string;

  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  avatar?: string;

  @IsEnum(Role)
  @Property({ default: Role.USER })
  role: Role = Role.USER;

  @IsEnum(AuthProvider)
  @Property({ default: AuthProvider.LOCAL })
  provider: AuthProvider = AuthProvider.LOCAL;

  @IsOptional()
  @IsBoolean()
  @Property({ default: true })
  isActive = true;

  @IsOptional()
  @Property({ nullable: true, default: 0 })
  failedLoginAttempts? = 0;

  @IsOptional()
  @Property({ nullable: true })
  lockedUntil?: Date;

  // --- Relations ---
  @Exclude()
  @OneToMany('SessionEntity', (session: SessionEntity) => session.user)
  sessions = new Collection<SessionEntity>(this);

  // --- Runtime Property ---
  @Exclude()
  sessionId?: string;

  // --- Lifecycle Hooks ---
  @BeforeCreate()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // --- Computed Getters ---
  @Property({ persist: false })
  get roleCode(): Opt<string> {
    return this.role;
  }

  @Property({ persist: false })
  get roles(): Opt<string[]> {
    return [this.role];
  }
}
