/**
 * @file base.controller.ts
 *
 * ## Mixin Pattern — tại sao không dùng `abstract class` thuần?
 *
 * NestJS resolve decorator metadata (Swagger `@ApiBody`, `@UsePipes`, v.v.)
 * **tại thời điểm decoration**, không phải lúc runtime. Generic type param
 * của TypeScript bị xoá sau khi compile (type erasure), nên `abstract class
 * BaseController<C>` không thể truyền `CreateDto` vào `@ApiBody({ type: CreateDto })`
 * một cách dynamic.
 *
 * Mixin factory là pattern chuẩn NestJS cho trường hợp này, nhất quán với
 * cách NestJS docs hướng dẫn (https://docs.nestjs.com/techniques/mvc#class-inheritance).
 * `BaseService` và `MikroOrmBaseRepository` dùng `abstract class` vì chúng
 * không cần bind decorator metadata với concrete DTO.
 */

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
  checkRouteEnabled,
  getRouteConfigs,
} from './helpers/helpers';
import { createBaseDtoBundle } from './helpers/dto-factory';
import type {
  BaseRoute,
  BaseControllerOptions,
  ControllerOptions,
  RouteConfig,
} from './helpers/types';

export type {
  BaseRoute,
  BaseControllerOptions,
  ControllerOptions,
  RouteConfig,
};

/** Contract của mọi controller được tạo bởi BaseController mixin. */
export interface IBaseController<
  E extends BaseEntity,
  C = Partial<E>,
  U = UpdateData<E>,
  CD = QueryCondition<E>,
> {
  create(user: IAuthUser, body: C): Promise<E>;
  getMany(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<E[]>;
  getPage(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<PaginatedResponseDto<E>>;
  getOne(
    user: IAuthUser,
    condition: CD,
    query: ParsedQueryOptions,
  ): Promise<E | null>;
  getById(
    user: IAuthUser,
    id: string,
    query: ParsedQueryOptions,
  ): Promise<E | null>;
  updateOne(user: IAuthUser, condition: CD, update: U): Promise<E | null>;
  updateById(user: IAuthUser, id: string, body: U): Promise<E | null>;
  updateByIds(
    user: IAuthUser,
    body: { ids: string[]; update: U },
  ): Promise<{ affected: number }>;
  deleteOne(user: IAuthUser, condition: CD): Promise<void>;
  deleteById(user: IAuthUser, id: string): Promise<void>;
  deleteByIds(
    user: IAuthUser,
    body: DeleteManyByIdsDto,
  ): Promise<{ deleted: number }>;
}

/**
 * Tạo base controller class với đầy đủ CRUD routes, Swagger docs, và
 * role-based access control được cấu hình sẵn.
 *
 * @example
 * ```ts
 * @ApiTags('users')
 * @Controller('users')
 * export class UserController extends BaseController(
 *   User,
 *   CreateUserDto,
 *   UpdateUserDto,
 *   UserConditionDto,
 *   { defaultRoles: [Role.ADMIN] },
 * ) {
 *   constructor(private readonly userService: UserService) {
 *     super(userService);
 *   }
 * }
 * ```
 */
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
  options: BaseControllerOptions<C, U, CD> = {},
): Type<IBaseController<E, C, U, CD>> {
  createDto = createDto ?? options.dtos?.create;
  updateDto = updateDto ?? options.dtos?.update;
  conditionDto = conditionDto ?? options.dtos?.condition;

  const routeConfigs = getRouteConfigs(options.routes);
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
    @ApiCreatedResponse({ description: 'Created', type: entityType })
    @ApiBody({ type: CreateDto })
    @UsePipes(validationPipes.create)
    async create(@ReqUser() user: IAuthUser, @Body() body: C): Promise<E> {
      checkRouteEnabled(routeConfigs.create);
      return this.service.create(user, body as Partial<E>);
    }

    @ApiGet('many', entityType)
    async getMany(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      checkRouteEnabled(routeConfigs.getMany);
      return this.service.getMany(
        user,
        condition as QueryCondition<E>,
        query as FindQuery<E>,
      );
    }

    @ApiGet('page', entityType)
    async getPage(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      checkRouteEnabled(routeConfigs.getPage);
      const { page = 1, limit = 10, ...findQuery } = query;
      return this.service.getPage(user, condition as QueryCondition<E>, {
        ...(findQuery as FindQuery<E>),
        page,
        limit,
      });
    }

    @ApiGet('one', entityType)
    async getOne(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      checkRouteEnabled(routeConfigs.getOne);
      return this.service.getOne(
        user,
        condition as QueryCondition<E>,
        query as FindQuery<E>,
      );
    }

    @Get(':id')
    @ApiOkResponse({ description: 'OK', type: entityType })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
    @ApiQueryOptions('one')
    async getById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      checkRouteEnabled(routeConfigs.getById);
      return this.service.getById(user, id, query as FindQuery<E>);
    }

    @Put('one')
    @ApiOkResponse({ description: 'OK', type: entityType })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
    @ApiBody({ type: UpdateDto })
    @ApiCondition(true)
    @UsePipes(validationPipes.update)
    async updateOne(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
      @Body() update: U,
    ): Promise<E | null> {
      checkRouteEnabled(routeConfigs.updateOne);
      return this.service.updateOne(
        user,
        condition as QueryCondition<E>,
        update as UpdateData<E>,
      );
    }

    @Put(':id')
    @ApiOkResponse({ description: 'OK', type: entityType })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
    @ApiBody({ type: UpdateDto })
    @UsePipes(validationPipes.update)
    async updateById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
      @Body() body: U,
    ): Promise<E | null> {
      checkRouteEnabled(routeConfigs.updateById);
      return this.service.updateById(user, id, body as UpdateData<E>);
    }

    @Put('bulk')
    @ApiOkResponse({ description: 'OK' })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(validationPipes.updateManyByIds)
    async updateByIds(
      @ReqUser() user: IAuthUser,
      @Body() body: { ids: string[]; update: U },
    ): Promise<{ affected: number }> {
      checkRouteEnabled(routeConfigs.updateByIds);
      return this.service.updateManyByIds(
        user,
        body.ids,
        body.update as UpdateData<E>,
      );
    }

    @Delete('one')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'No Content' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
    @ApiCondition(true)
    async deleteOne(
      @ReqUser() user: IAuthUser,
      @RequestCondition(ConditionDto, true) condition: CD,
    ): Promise<void> {
      checkRouteEnabled(routeConfigs.deleteOne);
      await this.service.deleteOne(user, condition as QueryCondition<E>);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'No Content' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
    async deleteById(
      @ReqUser() user: IAuthUser,
      @Param('id') id: string,
    ): Promise<void> {
      checkRouteEnabled(routeConfigs.deleteById);
      await this.service.deleteById(user, id);
    }

    @Delete('bulk')
    @ApiOkResponse({ description: 'OK' })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(validationPipes.deleteManyByIds)
    async deleteByIds(
      @ReqUser() user: IAuthUser,
      @Body() body: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      checkRouteEnabled(routeConfigs.deleteByIds);
      return this.service.deleteManyByIds(user, body.ids);
    }
  }

  Object.defineProperty(BaseControllerHost, 'name', {
    value: `${entityType.name}BaseController`,
  });

  applyRouteMetadata(BaseControllerHost, routeConfigs, options?.defaultRoles);

  return BaseControllerHost;
}
