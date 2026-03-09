import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpCode,
  Type,
  UsePipes,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BaseEntity } from '../../common/entity/base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../../common/constants/http-status.constant';
import { Authorize } from '../../common/decorators/authorize.decorator';
import { ReqUser } from '../../common/decorators/request-user.decorator';
import type { CurrentUserData } from '../../common/decorators/request-user.decorator';
import {
  RequestCondition,
  RequestQuery,
} from '../../common/decorators/query.decorator';
import type { ParsedQueryOptions } from '../../common/pipes/request-query.pipe';
import type {
  QueryCondition,
  UpdateData,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
} from '../../common/interfaces/repository.interface';
import { DeleteManyByIdsDto } from '../../common/dto/delete-many-byIds.dto';
import {
  ApiGet,
  ApiQueryOptions,
} from '../../common/decorators/api-get.decorator';
import {
  type BaseRoute,
  type RouteConfig,
  type CrudOptions,
  type ControllerFactoryOptions,
  normalizeRouteConfig,
  checkRouteEnabled,
  createDtos,
} from './crud';
import { BaseCrudService } from '../services/base-crud.service';

export type { BaseRoute, RouteConfig, CrudOptions, ControllerFactoryOptions };

export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  optionsOrCreateDto?: ControllerFactoryOptions | Type<unknown>,
  updateDtoLegacy?: Type<unknown>,
  optionsLegacy?: CrudOptions,
) {
  let conditionDto: Type<unknown> | undefined;
  let createDto: Type<unknown> | undefined;
  let updateDto: Type<unknown> | undefined;
  let options: CrudOptions | undefined;

  if (optionsOrCreateDto && 'routes' in optionsOrCreateDto) {
    const opts = optionsOrCreateDto;
    conditionDto = opts.conditionDto;
    createDto = opts.createDto;
    updateDto = opts.updateDto;
    options = { routes: opts.routes };
  } else if (
    optionsOrCreateDto &&
    typeof optionsOrCreateDto === 'function' &&
    !updateDtoLegacy &&
    !optionsLegacy
  ) {
    options = optionsOrCreateDto as unknown as CrudOptions;
  } else {
    createDto = optionsOrCreateDto as Type<unknown> | undefined;
    updateDto = updateDtoLegacy;
    options = optionsLegacy;
  }

  const routeConfigs: Record<BaseRoute, RouteConfig> = {
    create: normalizeRouteConfig(options?.routes?.create),
    getMany: normalizeRouteConfig(options?.routes?.getMany),
    getPage: normalizeRouteConfig(options?.routes?.getPage),
    getById: normalizeRouteConfig(options?.routes?.getById),
    getOne: normalizeRouteConfig(options?.routes?.getOne),
    updateById: normalizeRouteConfig(options?.routes?.updateById),
    updateByIds: normalizeRouteConfig(options?.routes?.updateByIds),
    upsert: normalizeRouteConfig(options?.routes?.upsert),
    getOneOrUpsert: normalizeRouteConfig(options?.routes?.getOneOrUpsert),
    deleteById: normalizeRouteConfig(options?.routes?.deleteById),
    deleteByIds: normalizeRouteConfig(options?.routes?.deleteByIds),
  };

  const { ConditionDto, CreateDto, UpdateDto, UpdateManyIdsDto, pipes } =
    createDtos(entityType, conditionDto, createDto, updateDto);

  abstract class BaseCrudControllerHost {
    constructor(
      public readonly service: BaseCrudService<E>,
      public readonly resourceName: string,
    ) {}

    @Post()
    @HttpCode(HTTP_STATUS.CREATED)
    @ApiCreatedResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.CREATED],
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(pipes.create)
    async create(
      @ReqUser() user: CurrentUserData,
      @Body() dto: Partial<E>,
    ): Promise<E> {
      checkRouteEnabled(routeConfigs.create);
      return this.service.create(user, dto);
    }

    @ApiGet('many', entityType)
    async getMany(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      checkRouteEnabled(routeConfigs.getMany);
      return this.service.getMany(user, condition, query as GetManyQuery<E>);
    }

    @ApiGet('page', entityType)
    async getPage(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      checkRouteEnabled(routeConfigs.getPage);
      return this.service.getPage(user, condition, {
        ...query,
        page: query.page || 1,
        limit: query.limit || 10,
      } as GetPageQuery<E>);
    }

    @ApiGet('one', entityType)
    async getOne(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      checkRouteEnabled(routeConfigs.getOne);
      return this.service.getOne(user, condition, query as GetOneQuery<E>);
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
    async getById(
      @ReqUser() user: CurrentUserData,
      @Param('id') id: string,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E> {
      checkRouteEnabled(routeConfigs.getById);
      return this.service.getById(user, id, query as GetByIdQuery<E>);
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
    @UsePipes(pipes.update)
    async updateById(
      @ReqUser() user: CurrentUserData,
      @Param('id') id: string,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      checkRouteEnabled(routeConfigs.updateById);
      return this.service.updateById(user, id, dto);
    }

    @Put('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(pipes.updateManyByIds)
    async updateByIds(
      @ReqUser() user: CurrentUserData,
      @Body() dto: { ids: string[]; update: UpdateData<E> },
    ): Promise<{ affected: number }> {
      checkRouteEnabled(routeConfigs.updateByIds);
      return this.service.updateManyByIds(user, dto.ids, dto.update);
    }

    @Post('upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(pipes.update)
    async upsert(
      @ReqUser() user: CurrentUserData,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      checkRouteEnabled(routeConfigs.upsert);
      const data = dto as Record<string, unknown>;
      const id = (data.id || data._id) as string | undefined;

      if (id) {
        const existing = await this.service.getByIdOrNull(user, id);
        if (existing) {
          return this.service.updateById(user, id, dto);
        }
      }

      return this.service.create(user, dto as Partial<E>);
    }

    @Post('one/upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(pipes.update)
    async getOneOrUpsert(
      @ReqUser() user: CurrentUserData,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      checkRouteEnabled(routeConfigs.getOneOrUpsert);
      const existing = await this.service.getOneOrNull(
        user,
        dto as QueryCondition<E>,
      );
      if (existing) return existing;
      return this.service.create(user, dto as Partial<E>);
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
    async deleteById(
      @ReqUser() user: CurrentUserData,
      @Param('id') id: string,
    ): Promise<void> {
      checkRouteEnabled(routeConfigs.deleteById);
      await this.service.deleteById(user, id);
    }

    @Delete('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(pipes.deleteManyByIds)
    async deleteByIds(
      @ReqUser() user: CurrentUserData,
      @Body() dto: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      checkRouteEnabled(routeConfigs.deleteByIds);
      return this.service.deleteManyByIds(user, dto.ids);
    }
  }

  const applyAuthToRoute = (methodName: string, config: RouteConfig) => {
    if (!config.enabled) return;
    Authorize(...(config.roles || []))(
      BaseCrudControllerHost.prototype,
      methodName,
      Object.getOwnPropertyDescriptor(
        BaseCrudControllerHost.prototype,
        methodName,
      ),
    );
  };

  Object.keys(routeConfigs).forEach((route) => {
    applyAuthToRoute(route, routeConfigs[route as BaseRoute]);
  });

  const defaultRoles = options?.defaultRoles || [];
  if (defaultRoles.length > 0) {
    Authorize(...defaultRoles)(BaseCrudControllerHost);
  } else {
    Authorize()(BaseCrudControllerHost);
  }

  return BaseCrudControllerHost;
}
