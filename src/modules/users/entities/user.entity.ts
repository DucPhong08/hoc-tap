import {
  Entity,
  Property,
  BeforeCreate,
  BeforeUpdate,
  ManyToOne,
} from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entity/base.entity';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { Role as RoleEntity } from '../../roles/entities/role.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  @Property({})
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
  @Property({ nullable: true })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Property({ default: true })
  isActive: boolean;

  @ManyToOne({
    entity: () => RoleEntity,
    nullable: true,
  })
  role?: RoleEntity;

  get roleCode(): string {
    return this.role ? this.role.code : 'user';
  }

  get roles(): string[] {
    return [this.roleCode];
  }

  @ApiProperty()
  @IsEnum(AuthProvider)
  @Property({ default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  avatar?: string;

  @BeforeCreate()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeCreate()
  async hashPassword(): Promise<void> {
    if (
      this.password &&
      !this.password.startsWith('$2b$') &&
      !this.password.startsWith('$2a$')
    ) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordUpdate(args: {
    changeSet?: { payload: { password?: string } };
  }): Promise<void> {
    if (this.password && args.changeSet?.payload?.password) {
      if (
        !this.password.startsWith('$2b$') &&
        !this.password.startsWith('$2a$')
      ) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }
  }
}
