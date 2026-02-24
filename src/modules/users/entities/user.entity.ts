import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';

export class UserEntity {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  @MaxLength(150)
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  @MaxLength(150)
  lastName!: string;

  @ApiPropertyOptional({ description: 'User password (hashed)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'User active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User roles',
    default: ['user'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  roles?: string[];

  @ApiProperty({
    description: 'Authentication provider',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
    enumName: 'AuthProvider',
  })
  @IsEnum(AuthProvider)
  provider?: AuthProvider;

  @ApiPropertyOptional({ description: 'Provider user ID (for OAuth)' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
