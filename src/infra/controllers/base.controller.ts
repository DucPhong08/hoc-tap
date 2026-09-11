import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Type,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { DeleteManyByIdsDto } from '@/common/dto/delete-many-by-ids.dto';
import { PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { BaseEntity } from '@/common/entity/base.entity';
import {
  RequestCondition,
  RequestQuery,
} from '@/common/decorators/query.decorator';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';
import {
  ApiCondition,
  ApiGet,
  ApiQueryOptions,
} from '@/common/decorators/api-get.decorator';
import type { ParsedQueryOptions } from '@/common/pipes/request-query.pipe';
import type {
  FindQuery,
  QueryCondition,
  UpdateData,
} from '@/common/interfaces/repository.interface';
import { BaseService } from '../services/base.service';
import {
  applyRouteMetadata,
  assertRouteEnabled,
  getRouteConfigs,
} from './helpers/helpers';
import { createBaseDtoBundle } from './helpers/dto-factory';
import type {
  BaseRoute,
  BaseControllerOptions,
  ControllerOptions,
  RouteConfig,
} from './helpers/types';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';

export type {
  BaseRoute,
  BaseControllerOptions,
  ControllerOptions,
  RouteConfig,
};

export interface IBaseController<
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
> {
  createEntity(user: IAuthUser, body: C): Promise<E>;
  listEntities(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<E[]>;
  paginateEntities(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<PaginatedResponseDto<E>>;
  findOneByCondition(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<E | null>;
  findEntityById(
    user: IAuthUser,
    id: string,
    query: ParsedQueryOptions,
  ): Promise<E | null>;
  updateOneByCondition(
    user: IAuthUser,
    condition: CD,
    update: U,
  ): Promise<E | null>;
  updateEntityById(user: IAuthUser, id: string, body: U): Promise<E | null>;
  updateEntitiesByIds(
    user: IAuthUser,
    body: { ids: string[]; update: U },
  ): Promise<{ affected: number }>;
  deleteOneByCondition(user: IAuthUser, condition: CD): Promise<void>;
  deleteEntityById(user: IAuthUser, id: string): Promise<void>;
  deleteEntitiesByIds(
    user: IAuthUser,
    body: DeleteManyByIdsDto,
  ): Promise<{ deleted: number }>;
}

export function BaseController<
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
>(
  entityType: Type<E>,
  options?: BaseControllerOptions<C, U, CD>,
): Type<IBaseController<E, C, U, CD>>;

export function BaseController<
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
>(
  entityType: Type<E>,
  createDto?: Type<C>,
  updateDto?: Type<U>,
  conditionDto?: Type<CD>,
  options?: BaseControllerOptions<C, U, CD>,
): Type<IBaseController<E, C, U, CD>>;

export function BaseController<
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
>(
  entityType: Type<E>,
  createDtoOrOptions?: Type<C> | BaseControllerOptions<C, U, CD>,
  updateDto?: Type<U>,
  conditionDto?: Type<CD>,
  options: BaseControllerOptions<C, U, CD> = {},
): Type<IBaseController<E, C, U, CD>> {
  let createDto: Type<C> | undefined;
  let controllerOptions = options;

  if (
    createDtoOrOptions &&
    typeof createDtoOrOptions === 'object' &&
    !('prototype' in createDtoOrOptions)
  ) {
    controllerOptions = createDtoOrOptions;
  } else {
    createDto = createDtoOrOptions as Type<C> | undefined;
  }

  createDto = createDto ?? controllerOptions.dtos?.create;
  updateDto = updateDto ?? controllerOptions.dtos?.update;
  conditionDto = conditionDto ?? controllerOptions.dtos?.condition;

  const routeConfigs = getRouteConfigs(controllerOptions.routes);
  const {
    ConditionDto,
    CreateDto,
    UpdateDto,
    UpdateManyIdsDto,
    validationPipes,
  } = createBaseDtoBundle(entityType, createDto, updateDto, conditionDto);

  class BaseControllerHost implements IBaseController<E, C, U, CD> {
    constructor(protected readonly service: BaseService<E>) {}

    @Post()
    @ApiCreatedResponse({
      description: 'Created',
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(validationPipes.create)
    async createEntity(
      @ReqUser() user: IAuthUser,
      @Body() body: C,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.create);
      return this.service.create(user, body as Partial<E>);
    }

    @ApiGet('many', entityType)
    async listEntities(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      assertRouteEnabled(routeConfigs.getMany);
      return this.service.getMany(
        user,
        condition as QueryCondition<E>,
        query as FindQuery<E>,
      );
    }

    @ApiGet('page', entityType)
    async paginateEntities(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      assertRouteEnabled(routeConfigs.getPage);
      const { page = 1, limit = 10, ...findQuery } = query;
      return this.service.getPage(user, condition as QueryCondition<E>, {
        ...(findQuery as FindQuery<E>),
        page,
        limit,
      });
    }

    @ApiGet('one', entityType)
    async findOneByCondition(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.getOne);
      return this.service.getOne(
        user,
        condition as QueryCondition<E>,
        query as FindQuery<E>,
      );
    }

    @Get(':id')
    @ApiOkResponse({
      description: 'OK',
      type: entityType,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })
    @ApiQueryOptions('one')
    async findEntityById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.getById);
      return this.service.getById(user, id, query as FindQuery<E>);
    }

    @Put('one')
    @ApiOkResponse({
      description: 'OK',
      type: entityType,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })
    @ApiBody({ type: UpdateDto })
    @ApiCondition(true)
    @UsePipes(validationPipes.update)
    async updateOneByCondition(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
      @Body() update: U,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.updateOne);
      return this.service.updateOne(
        user,
        condition as QueryCondition<E>,
        update as UpdateData<E>,
      );
    }

    @Put(':id')
    @ApiOkResponse({
      description: 'OK',
      type: entityType,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(validationPipes.update)
    async updateEntityById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
      @Body() body: U,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.updateById);
      return this.service.updateById(user, id, body as UpdateData<E>);
    }

    @Put('many/ids')
    @ApiOkResponse({ description: 'OK' })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(validationPipes.updateManyByIds)
    async updateEntitiesByIds(
      @ReqUser() user: IAuthUser,
      @Body() body: { ids: string[]; update: U },
    ): Promise<{ affected: number }> {
      assertRouteEnabled(routeConfigs.updateByIds);
      return this.service.updateManyByIds(
        user,
        body.ids,
        body.update as UpdateData<E>,
      );
    }

    @Delete('one')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'No Content',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })
    @ApiCondition(true)
    async deleteOneByCondition(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
    ): Promise<void> {
      assertRouteEnabled(routeConfigs.deleteOne);
      await this.service.deleteOne(user, condition as QueryCondition<E>);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'No Content',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not Found',
    })
    async deleteEntityById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
    ): Promise<void> {
      assertRouteEnabled(routeConfigs.deleteById);
      await this.service.deleteById(user, id);
    }

    @Delete('many/ids')
    @ApiOkResponse({ description: 'OK' })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(validationPipes.deleteManyByIds)
    async deleteEntitiesByIds(
      @ReqUser() user: IAuthUser,
      @Body() body: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      assertRouteEnabled(routeConfigs.deleteByIds);
      return this.service.deleteManyByIds(user, body.ids);
    }
  }

  Object.defineProperty(BaseControllerHost, 'name', {
    value: `${entityType.name}BaseController`,
  });

  applyRouteMetadata(
    BaseControllerHost,
    routeConfigs,
    controllerOptions?.defaultRoles ?? [SystemRole.ADMIN],
  );

  return BaseControllerHost;
}

export const BaseControllerFactory = BaseController;
