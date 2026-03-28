import { Type } from '@nestjs/common';
import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { BaseEntity } from '../../../common/entity/base.entity';
import type {
  QueryCondition,
  UpdateData,
} from '../../../common/interfaces/repository.interface';
import { AbstractValidationPipe } from '../../../common/pipes/abstract-validation.pipe';
import { DeleteManyByIdsDto } from '../../../common/dto/delete-many-byIds.dto';
import { renameGeneratedClass } from './helpers';

export interface CrudDtoBundle {
  ConditionDto: Type<unknown>;
  CreateDto: Type<unknown>;
  UpdateDto: Type<unknown>;
  UpdateOneDto: Type<unknown>;
  UpdateManyIdsDto: Type<unknown>;
  DeleteOneDto: Type<unknown>;
  validationPipes: {
    create: AbstractValidationPipe;
    update: AbstractValidationPipe;
    updateOne: AbstractValidationPipe;
    updateManyByIds: AbstractValidationPipe;
    deleteOne: AbstractValidationPipe;
    deleteManyByIds: AbstractValidationPipe;
  };
}

export const createCrudDtoBundle = <E extends BaseEntity>(
  entityType: Type<E>,
  conditionDto?: Type<unknown>,
  createDto?: Type<unknown>,
  updateDto?: Type<unknown>,
): CrudDtoBundle => {
  const ConditionDto =
    conditionDto ||
    renameGeneratedClass(
      `${entityType.name}ConditionDto`,
      PartialType(entityType),
    );

  const CreateDto =
    createDto ||
    renameGeneratedClass(
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
    renameGeneratedClass(
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

  const UpdateManyIdsDto = renameGeneratedClass(
    `UpdateMany${entityType.name}IdsDto`,
    UpdateManyByIdsDto,
  );

  class UpdateOneDto {
    @ApiProperty({ type: ConditionDto, description: 'Filter condition' })
    @ValidateNested()
    @TransformType(() => ConditionDto)
    condition: QueryCondition<E>;

    @ApiProperty({ type: UpdateDto, description: 'Update data' })
    @ValidateNested()
    @TransformType(() => UpdateDto)
    update: UpdateData<E>;
  }

  const UpdateOneByConditionDto = renameGeneratedClass(
    `UpdateOne${entityType.name}Dto`,
    UpdateOneDto,
  );

  class DeleteOneDto {
    @ApiProperty({ type: ConditionDto, description: 'Filter condition' })
    @ValidateNested()
    @TransformType(() => ConditionDto)
    condition: QueryCondition<E>;
  }

  const DeleteOneByConditionDto = renameGeneratedClass(
    `DeleteOne${entityType.name}Dto`,
    DeleteOneDto,
  );

  const validationPipes = {
    create: new AbstractValidationPipe(
      { whitelist: true },
      { body: CreateDto },
    ),
    update: new AbstractValidationPipe(
      { whitelist: true },
      { body: UpdateDto },
    ),
    updateOne: new AbstractValidationPipe(
      { whitelist: true },
      { body: UpdateOneByConditionDto },
    ),
    updateManyByIds: new AbstractValidationPipe(
      { whitelist: true },
      { body: UpdateManyIdsDto },
    ),
    deleteOne: new AbstractValidationPipe(
      { whitelist: true },
      { body: DeleteOneByConditionDto },
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
    UpdateOneDto: UpdateOneByConditionDto,
    UpdateManyIdsDto,
    DeleteOneDto: DeleteOneByConditionDto,
    validationPipes,
  };
};
