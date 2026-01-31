import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteManyByIdsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Array of IDs to delete',
  })
  ids: string[];
}
