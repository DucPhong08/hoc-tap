import {
  Body,
  Delete,
  Get,
  HttpCode,
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
import { DeleteManyByIdsDto } from '@/common/dto/delete-many-byIds.dto';
import { PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { BaseEntity } from '@/common/entity/base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '@/common/constants/http-status.constant';
import {
  RequestCondition,
  RequestQuery,
} from '@/common/decorators/query.decorator';
import { ReqUser } from '@/common/decorators/request-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { ApiGet, ApiQueryOptions } from '@/common/decorators/api-get.decorator';
import type { ParsedQueryOptions } from '@/common/pipes';
import type {
  FindQuery,
  QueryCondition,
  UpdateData,
} from '@/common/interfaces/repository.interface';
import { BaseCrudService } from '../services/base-crud.service';
import {
  setupAuthorization,
  setupAudit,
  assertRouteEnabled,
  getRouteConfigs,
} from './crud/helpers';
import { createCrudDtoBundle } from './crud/dto-factory';
import type {
  BaseRoute,
  CrudOptions,
  CrudRouteDefinition,
  RouteConfig,
} from './crud/types';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';

export type { BaseRoute, CrudOptions, RouteConfig };

const CRUD_ROUTE_DEFINITIONS: CrudRouteDefinition[] = [
  { route: 'create', handlerName: 'createEntity' },
  { route: 'getMany', handlerName: 'listEntities' },
  { route: 'getPage', handlerName: 'paginateEntities' },
  { route: 'getById', handlerName: 'findEntityById' },
  { route: 'getOne', handlerName: 'findOneByCondition' },
  { route: 'updateOne', handlerName: 'updateOneByCondition' },
  { route: 'updateById', handlerName: 'updateEntityById' },
  { route: 'updateByIds', handlerName: 'updateEntitiesByIds' },
  { route: 'deleteOne', handlerName: 'deleteOneByCondition' },
  { route: 'deleteById', handlerName: 'deleteEntityById' },
  { route: 'deleteByIds', handlerName: 'deleteEntitiesByIds' },
];

export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  createDto?: Type<unknown>,
  updateDto?: Type<unknown>,
  conditionDto?: Type<unknown>,
  options: CrudOptions = {},
): Type<object> {
  const routeConfigs = getRouteConfigs(options.routes);
  const {
    ConditionDto,
    CreateDto,
    UpdateDto,
    UpdateManyIdsDto,
    validationPipes,
  } = createCrudDtoBundle(entityType, createDto, updateDto, conditionDto);

  class CrudControllerHost {
    constructor(protected readonly service: BaseCrudService<E>) {}

    @Post()
    @ApiCreatedResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.CREATED],
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(validationPipes.create)
    async createEntity(
      @ReqUser() user: User | null,
      @Body() body: Partial<E>,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.create);
      return this.service.create(user, body);
    }

    @ApiGet('many', entityType)
    async listEntities(
      @ReqUser() user: User | null,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      assertRouteEnabled(routeConfigs.getMany);
      return this.service.getMany(user, condition, query as FindQuery<E>);
    }

    @ApiGet('page', entityType)
    async paginateEntities(
      @ReqUser() user: User | null,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      assertRouteEnabled(routeConfigs.getPage);
      const { page = 1, limit = 10, ...findQuery } = query;
      return this.service.getPage(user, condition, {
        ...(findQuery as FindQuery<E>),
        page,
        limit,
      });
    }

    @ApiGet('one', entityType)
    async findOneByCondition(
      @ReqUser() user: User | null,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.getOne);
      return this.service.getOne(user, condition, query as FindQuery<E>);
    }

    @Get(':id')
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    @ApiQueryOptions('one')
    async findEntityById(
      @ReqUser() user: User | null,
      @Param('id') id: string,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.getById);
      return this.service.getById(user, id, query as FindQuery<E>);
    }

    @Put('one')
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(validationPipes.update)
    async updateOneByCondition(
      @ReqUser() user: User | null,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @Body() update: UpdateData<E>,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.updateOne);
      return this.service.updateOne(user, condition, update);
    }

    @Put(':id')
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(validationPipes.update)
    async updateEntityById(
      @ReqUser() user: User | null,
      @Param('id') id: string,
      @Body() body: UpdateData<E>,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.updateById);
      return this.service.updateById(user, id, body);
    }

    @Put('many/ids')
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(validationPipes.updateManyByIds)
    async updateEntitiesByIds(
      @ReqUser() user: User | null,
      @Body() body: { ids: string[]; update: UpdateData<E> },
    ): Promise<{ affected: number }> {
      assertRouteEnabled(routeConfigs.updateByIds);
      return this.service.updateManyByIds(user, body.ids, body.update);
    }

    @Delete('one')
    @HttpCode(HTTP_STATUS.NO_CONTENT)
    @ApiResponse({
      status: HTTP_STATUS.NO_CONTENT,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NO_CONTENT],
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    async deleteOneByCondition(
      @ReqUser() user: User | null,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
    ): Promise<void> {
      assertRouteEnabled(routeConfigs.deleteOne);
      await this.service.deleteOne(user, condition);
    }

    @Delete(':id')
    @HttpCode(HTTP_STATUS.NO_CONTENT)
    @ApiResponse({
      status: HTTP_STATUS.NO_CONTENT,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NO_CONTENT],
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    async deleteEntityById(
      @ReqUser() user: User | null,
      @Param('id') id: string,
    ): Promise<void> {
      assertRouteEnabled(routeConfigs.deleteById);
      await this.service.deleteById(user, id);
    }

    @Delete('many/ids')
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(validationPipes.deleteManyByIds)
    async deleteEntitiesByIds(
      @ReqUser() user: User | null,
      @Body() body: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      assertRouteEnabled(routeConfigs.deleteByIds);
      return this.service.deleteManyByIds(user, body.ids);
    }
  }

  setupAuthorization(
    CrudControllerHost,
    CRUD_ROUTE_DEFINITIONS,
    routeConfigs,
    options?.defaultRoles ? options.defaultRoles : [SystemRole.ADMIN],
  );
  setupAudit(CrudControllerHost, CRUD_ROUTE_DEFINITIONS, routeConfigs);

  return CrudControllerHost;
}
