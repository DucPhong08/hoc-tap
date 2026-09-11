import { Type } from '@nestjs/common';
import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  QueryCondition,
  UpdateData,
} from '@/common/interfaces/repository.interface';
import { DtoValidationPipe } from '@/common/pipes/dto-validation.pipe';
import { DeleteManyByIdsDto } from '@/common/dto/delete-many-by-ids.dto';

const rename = <T>(name: string, cls: Type<T>): Type<T> => {
  const renamed = class extends (cls as Type<object>) {};
  Object.defineProperty(renamed, 'name', { value: name });
  return renamed as Type<T>;
};

export interface BaseDtoBundle<C = unknown, U = unknown, CD = unknown> {
  ConditionDto: Type<CD>;
  CreateDto: Type<C>;
  UpdateDto: Type<U>;
  UpdateManyIdsDto: Type<object>;
  validationPipes: {
    create: DtoValidationPipe;
    update: DtoValidationPipe;
    updateManyByIds: DtoValidationPipe;
    deleteManyByIds: DtoValidationPipe;
  };
}

const BASE_OMIT_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt'] as const;

export const createBaseDtoBundle = <
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
>(
  entityType: Type<E>,
  createDto?: Type<C>,
  updateDto?: Type<U>,
  conditionDto?: Type<CD>,
): BaseDtoBundle<C, U, CD> => {
  const ConditionDto = (conditionDto ??
    rename(
      `${entityType.name}ConditionDto`,
      PartialType(entityType),
    )) as Type<CD>;
  const CreateDto = (createDto ??
    rename(
      `Create${entityType.name}Dto`,
      OmitType(entityType, BASE_OMIT_FIELDS),
    )) as Type<C>;
  const UpdateDto = (updateDto ??
    rename(
      `Update${entityType.name}Dto`,
      PartialType(OmitType(entityType, BASE_OMIT_FIELDS)),
    )) as Type<U>;

  class UpdateManyByIdsDto {
    @IsString({ each: true })
    @ApiProperty({ type: [String], description: 'Array of IDs to update' })
    ids: string[];

    @ApiProperty({ type: UpdateDto, description: 'Update data' })
    @ValidateNested()
    @TransformType(() => UpdateDto)
    update: UpdateData<E>;
  }

  const UpdateManyIdsDto = rename(
    `UpdateMany${entityType.name}IdsDto`,
    UpdateManyByIdsDto,
  );

  const validationPipes = {
    create: new DtoValidationPipe({ whitelist: true }, { body: CreateDto }),
    update: new DtoValidationPipe({ whitelist: true }, { body: UpdateDto }),
    updateManyByIds: new DtoValidationPipe(
      { whitelist: true },
      { body: UpdateManyIdsDto },
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
    UpdateManyIdsDto,
    validationPipes,
  };
};
