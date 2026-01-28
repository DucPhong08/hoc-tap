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
import { BaseEntity } from '../../../common/base.entity';
import { AuthProvider } from '../../../auth/enums/auth-provider.enum';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150 })
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150 })
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'text', nullable: true })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @Property({ type: 'json', default: ['user'] })
  roles: string[] = ['user'];

  @ApiProperty()
  @IsEnum(AuthProvider)
  @Property({ type: 'varchar', default: AuthProvider.LOCAL })
  provider: AuthProvider = AuthProvider.LOCAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'varchar', nullable: true })
  providerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'varchar', nullable: true })
  avatar?: string;
}
