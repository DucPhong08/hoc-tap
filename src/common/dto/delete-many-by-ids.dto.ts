import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class DeleteManyByIdsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of IDs to delete',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids: string[];
}
