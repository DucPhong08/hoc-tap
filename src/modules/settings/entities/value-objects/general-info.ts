import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * GeneralInfo - Thông tin chung của hệ thống
 */
export class GeneralInfo {
  @ApiProperty({ description: 'Tên ứng dụng' })
  @IsString()
  appName!: string;

  @ApiPropertyOptional({ description: 'Mô tả ứng dụng' })
  @IsOptional()
  @IsString()
  appDescription?: string;

  @ApiPropertyOptional({ description: 'Logo ứng dụng (URL)' })
  @IsOptional()
  @IsUrl()
  appLogo?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ mặc định' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ description: 'Múi giờ' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Email liên hệ' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;
}
