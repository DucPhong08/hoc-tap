import { Type } from '@nestjs/common';
import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { BaseEntity } from '../../../common/entity/base.entity';
import type {
  QueryCondition,
  UpdateData,
} from '../../../common/interfaces/repository.interface';
import { DtoValidationPipe } from '../../../common/pipes';
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
    create: DtoValidationPipe;
    update: DtoValidationPipe;
    updateOne: DtoValidationPipe;
    updateManyByIds: DtoValidationPipe;
    deleteOne: DtoValidationPipe;
    deleteManyByIds: DtoValidationPipe;
  };
}

const BASE_OMIT_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt'] as const;

export const createCrudDtoBundle = <E extends BaseEntity>(
  entityType: Type<E>,
  createDto?: Type<unknown>,
  updateDto?: Type<unknown>,
): CrudDtoBundle => {
  const ConditionDto = renameGeneratedClass(
    `${entityType.name}ConditionDto`,
    PartialType(entityType),
  );

  const CreateDto =
    createDto ||
    renameGeneratedClass(
      `Create${entityType.name}Dto`,
      OmitType(entityType, BASE_OMIT_FIELDS),
    );

  const UpdateDto =
    updateDto ||
    renameGeneratedClass(
      `Update${entityType.name}Dto`,
      PartialType(OmitType(entityType, BASE_OMIT_FIELDS)),
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
    create: new DtoValidationPipe({ whitelist: true }, { body: CreateDto }),
    update: new DtoValidationPipe({ whitelist: true }, { body: UpdateDto }),
    updateOne: new DtoValidationPipe(
      { whitelist: true },
      { body: UpdateOneByConditionDto },
    ),
    updateManyByIds: new DtoValidationPipe(
      { whitelist: true },
      { body: UpdateManyIdsDto },
    ),
    deleteOne: new DtoValidationPipe(
      { whitelist: true },
      { body: DeleteOneByConditionDto },
    ),
    deleteManyByIds: new DtoValidationPipe(
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
