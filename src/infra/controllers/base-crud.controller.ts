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
      description: 'Created',
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(validationPipes.create)
    async createEntity(
      @ReqUser() user: IAuthUser,
      @Body() body: Partial<E>,
    ): Promise<E> {
      assertRouteEnabled(routeConfigs.create);
      return this.service.create(user, body);
    }

    @ApiGet('many', entityType)
    async listEntities(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      assertRouteEnabled(routeConfigs.getMany);
      return this.service.getMany(user, condition, query as FindQuery<E>);
    }

    @ApiGet('page', entityType)
    async paginateEntities(
      @ReqUser() user: IAuthUser,
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
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.getOne);
      return this.service.getOne(user, condition, query as FindQuery<E>);
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
      @RequestCondition(ConditionDto, true) condition: QueryCondition<E>,
      @Body() update: UpdateData<E>,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.updateOne);
      return this.service.updateOne(user, condition, update);
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
      @Body() body: UpdateData<E>,
    ): Promise<E | null> {
      assertRouteEnabled(routeConfigs.updateById);
      return this.service.updateById(user, id, body);
    }

    @Put('many/ids')
    @ApiOkResponse({ description: 'OK' })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(validationPipes.updateManyByIds)
    async updateEntitiesByIds(
      @ReqUser() user: IAuthUser,
      @Body() body: { ids: string[]; update: UpdateData<E> },
    ): Promise<{ affected: number }> {
      assertRouteEnabled(routeConfigs.updateByIds);
      return this.service.updateManyByIds(user, body.ids, body.update);
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
      @RequestCondition(ConditionDto, true) condition: QueryCondition<E>,
    ): Promise<void> {
      assertRouteEnabled(routeConfigs.deleteOne);
      await this.service.deleteOne(user, condition);
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

  Object.defineProperty(CrudControllerHost, 'name', {
    value: `${entityType.name}CrudController`,
  });

  setupAuthorization(
    CrudControllerHost,
    CRUD_ROUTE_DEFINITIONS,
    routeConfigs,
    options?.defaultRoles ?? [SystemRole.ADMIN],
  );
  setupAudit(CrudControllerHost, CRUD_ROUTE_DEFINITIONS, routeConfigs);

  return CrudControllerHost;
}
