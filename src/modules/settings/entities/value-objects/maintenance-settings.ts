import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

/**
 * MaintenanceSettings - Cấu hình bảo trì hệ thống
 */
export class MaintenanceSettings {
  @ApiProperty({ description: 'Thời gian bắt đầu bảo trì' })
  @Type(() => Date)
  @IsDate()
  scheduledStart!: Date;

  @ApiProperty({ description: 'Thời gian kết thúc bảo trì' })
  @Type(() => Date)
  @IsDate()
  scheduledEnd!: Date;

  @ApiProperty({ description: 'Tiêu đề bảo trì (Tiếng Việt)' })
  @IsString()
  titleVi!: string;

  @ApiProperty({ description: 'Tiêu đề bảo trì (Tiếng Anh)' })
  @IsString()
  titleEn!: string;

  @ApiPropertyOptional({
    description: 'Nội dung thông báo bảo trì (Tiếng Việt)',
  })
  @IsOptional()
  @IsString()
  messageVi?: string;

  @ApiPropertyOptional({
    description: 'Nội dung thông báo bảo trì (Tiếng Anh)',
  })
  @IsOptional()
  @IsString()
  messageEn?: string;

  @ApiPropertyOptional({ description: 'Có bật chế độ bảo trì không' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
