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
import { DeleteManyByIdsDto } from '../../common/dto/delete-many-byIds.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BaseEntity } from '../../common/entity/base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../../common/constants/http-status.constant';
import {
  RequestCondition,
  RequestQuery,
} from '../../common/decorators/query.decorator';
import { ReqUser } from '../../common/decorators/request-user.decorator';
import type { CurrentUserData } from '../../common/decorators/request-user.decorator';
import {
  ApiGet,
  ApiQueryOptions,
} from '../../common/decorators/api-get.decorator';
import type { ParsedQueryOptions } from '../../common/pipes';
import type {
  FindQuery,
  QueryCondition,
  UpdateData,
} from '../../common/interfaces/repository.interface';
import { BaseCrudService } from '../services/base-crud.service';
import {
  applyCrudAuthorization,
  assertRouteEnabled,
  buildRouteConfigMap,
  createCrudDtoBundle,
  renameGeneratedClass,
  type BaseRoute,
  type CrudOptions,
  type CrudRouteDefinition,
  type RouteConfig,
} from './crud';

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

export function createCrudController<E extends BaseEntity>(
  entityType: Type<E>,
  createDto?: Type<unknown>,
  updateDto?: Type<unknown>,
  options: CrudOptions = {},
): Type<object> {
  const routeConfigs = buildRouteConfigMap(options.routes);
  const {
    ConditionDto,
    CreateDto,
    UpdateDto,
    UpdateOneDto,
    UpdateManyIdsDto,
    DeleteOneDto,
    validationPipes,
  } = createCrudDtoBundle(entityType, createDto, updateDto);

  class CrudControllerHost {
    constructor(protected readonly service: BaseCrudService<E>) {}

    @Post()
    @HttpCode(HTTP_STATUS.CREATED)
    @ApiCreatedResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.CREATED],
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(validationPipes.create)
    async createEntity(
      @ReqUser() _currentUser: CurrentUserData,
      @Body() body: Partial<E>,
    ): Promise<E> {
      this.assertRouteAvailable('create');
      return this.service.create(body);
    }

    @ApiGet('many', entityType)
    async listEntities(
      @ReqUser() _currentUser: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      this.assertRouteAvailable('getMany');
      return this.service.getMany(condition, this.parseFindQuery(query));
    }

    @ApiGet('page', entityType)
    async paginateEntities(
      @ReqUser() _currentUser: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      this.assertRouteAvailable('getPage');
      return this.service.getPage(condition, this.parsePaginationQuery(query));
    }

    @ApiGet('one', entityType)
    async findOneByCondition(
      @ReqUser() _currentUser: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E> {
      this.assertRouteAvailable('getOne');
      return this.service.getOne(condition, this.parseFindQuery(query));
    }

    @Get(':id')
    @HttpCode(HTTP_STATUS.OK)
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
      @ReqUser() _currentUser: CurrentUserData,
      @Param('id') id: string,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E> {
      this.assertRouteAvailable('getById');
      return this.service.getById(id, this.parseFindQuery(query));
    }

    @Put(':id')
    @HttpCode(HTTP_STATUS.OK)
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
      @ReqUser() _currentUser: CurrentUserData,
      @Param('id') id: string,
      @Body() body: UpdateData<E>,
    ): Promise<E> {
      this.assertRouteAvailable('updateById');
      return this.service.updateById(id, body);
    }

    @Put('one')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    @ApiBody({ type: UpdateOneDto })
    @UsePipes(validationPipes.updateOne)
    async updateOneByCondition(
      @ReqUser() _currentUser: CurrentUserData,
      @Body() body: { condition: QueryCondition<E>; update: UpdateData<E> },
    ): Promise<E> {
      this.assertRouteAvailable('updateOne');
      return this.service.updateOne(body.condition, body.update);
    }

    @Put('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(validationPipes.updateManyByIds)
    async updateEntitiesByIds(
      @ReqUser() _currentUser: CurrentUserData,
      @Body() body: { ids: string[]; update: UpdateData<E> },
    ): Promise<{ affected: number }> {
      this.assertRouteAvailable('updateByIds');
      return this.service.updateManyByIds(body.ids, body.update);
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
      @ReqUser() _currentUser: CurrentUserData,
      @Param('id') id: string,
    ): Promise<void> {
      this.assertRouteAvailable('deleteById');
      await this.service.deleteById(id);
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
    @ApiBody({ type: DeleteOneDto })
    @UsePipes(validationPipes.deleteOne)
    async deleteOneByCondition(
      @ReqUser() _currentUser: CurrentUserData,
      @Body() body: { condition: QueryCondition<E> },
    ): Promise<void> {
      this.assertRouteAvailable('deleteOne');
      await this.service.deleteOne(body.condition);
    }

    @Delete('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(validationPipes.deleteManyByIds)
    async deleteEntitiesByIds(
      @ReqUser() _currentUser: CurrentUserData,
      @Body() body: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      this.assertRouteAvailable('deleteByIds');
      return this.service.deleteManyByIds(body.ids);
    }

    private assertRouteAvailable(route: BaseRoute): void {
      assertRouteEnabled(routeConfigs[route]);
    }

    private parseFindQuery(query: ParsedQueryOptions): FindQuery<E> {
      return query as FindQuery<E>;
    }

    private parsePaginationQuery(
      query: ParsedQueryOptions,
    ): FindQuery<E> & { page: number; limit: number } {
      return {
        ...this.parseFindQuery(query),
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      };
    }
  }

  const GeneratedCrudController = renameGeneratedClass(
    `${entityType.name}CrudController`,
    CrudControllerHost,
  );

  applyCrudAuthorization(
    GeneratedCrudController,
    CRUD_ROUTE_DEFINITIONS,
    routeConfigs,
    options.defaultRoles,
  );

  return GeneratedCrudController;
}

export const BaseCrudControllerFactory = createCrudController;
