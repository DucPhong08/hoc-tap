import { Entity, Property } from '@mikro-orm/core';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entity/base.entity';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @Property({ default: ['user'] })
  roles: string[];

  @ApiProperty()
  @IsEnum(AuthProvider)
  @Property({ default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  providerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  avatar?: string;
}
