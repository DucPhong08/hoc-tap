import {
  Entity,
  Property,
  BeforeCreate,
  BeforeUpdate,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@/common/entity/base.entity';
import { AuthProvider } from '@/modules/auth/enums/auth-provider.enum';
import { Role } from '@/common/constants/role.constant';
import type { SessionEntity } from '@/modules/auth/entities/session.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  @Property({ unique: true })
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({})
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({})
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ nullable: true, hidden: true })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  avatar?: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  @Property({ default: Role.USER })
  role: Role = Role.USER;

  @ApiProperty()
  @IsEnum(AuthProvider)
  @Property({ default: AuthProvider.LOCAL })
  provider: AuthProvider = AuthProvider.LOCAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Property({ default: true })
  isActive = true;

  @ApiPropertyOptional()
  @IsOptional()
  @Property({ nullable: true, default: 0 })
  failedLoginAttempts = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @Property({ nullable: true })
  lockedUntil?: Date;

  // --- Relations ---
  @OneToMany('SessionEntity', (session: SessionEntity) => session.user)
  sessions = new Collection<SessionEntity>(this);

  // --- Runtime Property ---
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
  get roleCode(): string {
    return this.role;
  }

  get roles(): string[] {
    return [this.role];
  }
}
