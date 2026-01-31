import { Type } from '@nestjs/common';
import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { BaseEntity } from '../../entity/base.entity';
import type { UpdateData } from '../../interfaces/repository.interface';
import { AbstractValidationPipe } from '../../pipes/abstract-validation.pipe';
import { DeleteManyByIdsDto } from '../../dto/delete-many-byIds.dto';
import { ClassName } from './helpers';

export interface DtoFactoryResult {
  ConditionDto: Type<unknown>;
  CreateDto: Type<unknown>;
  UpdateDto: Type<unknown>;
  UpdateManyIdsDto: Type<unknown>;
  pipes: {
    create: AbstractValidationPipe;
    update: AbstractValidationPipe;
    updateManyByIds: AbstractValidationPipe;
    deleteManyByIds: AbstractValidationPipe;
  };
}

export const createDtos = <E extends BaseEntity>(
  entityType: Type<E>,
  conditionDto?: Type<unknown>,
  createDto?: Type<unknown>,
  updateDto?: Type<unknown>,
): DtoFactoryResult => {
  const ConditionDto =
    conditionDto ||
    ClassName(`${entityType.name}ConditionDto`, PartialType(entityType));

  const CreateDto =
    createDto ||
    ClassName(
      `Create${entityType.name}Dto`,
      OmitType(entityType, [
        '_id',
        'id',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ] as const),
    );

  const UpdateDto =
    updateDto ||
    ClassName(
      `Update${entityType.name}Dto`,
      PartialType(
        OmitType(entityType, [
          '_id',
          'id',
          'createdAt',
          'updatedAt',
          'deletedAt',
        ] as const),
      ),
    );

  class UpdateManyByIdsDto {
    @IsString({ each: true })
    @ApiProperty({ type: [String], description: 'Array of IDs to update' })
    ids: string[];

    @ApiProperty({ type: UpdateDto, description: 'Update data' })
    @ValidateNested()
    @TransformType(() => UpdateDto)
    update: UpdateData<E>;
  }

  const UpdateManyIdsDto = ClassName(
    `UpdateMany${entityType.name}IdsDto`,
    UpdateManyByIdsDto,
  );

  const pipes = {
    create: new AbstractValidationPipe(
      { whitelist: true },
      { body: CreateDto },
    ),
    update: new AbstractValidationPipe(
      { whitelist: true },
      { body: UpdateDto },
    ),
    updateManyByIds: new AbstractValidationPipe(
      { whitelist: true },
      { body: UpdateManyIdsDto },
    ),
    deleteManyByIds: new AbstractValidationPipe(
      { whitelist: true },
      { body: DeleteManyByIdsDto },
    ),
  };

  return {
    ConditionDto,
    CreateDto,
    UpdateDto,
    UpdateManyIdsDto,
    pipes,
  };
};
