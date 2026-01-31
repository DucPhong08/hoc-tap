import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpCode,
  NotFoundException,
  Type,
  UsePipes,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiQuery,
  OmitType,
  PartialType,
  ApiProperty,
} from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginatedResponseDto } from '../dto/pagination.dto';
import { BaseEntity } from '../entity/base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../constants/http-status.constant';
import { Authorize } from '../decorators/authorize.decorator';
import { ReqUser } from '../decorators/request-user.decorator';
import type { CurrentUserData } from '../decorators/request-user.decorator';
import { RequestCondition, RequestQuery } from '../decorators/query.decorator';
import type { ParsedQueryOptions } from '../pipes/request-query.pipe';
import type {
  QueryCondition,
  UpdateData,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
} from '../interfaces/repository.interface';
import { AbstractValidationPipe } from '../pipes/abstract-validation.pipe';
import { DeleteManyByIdsDto } from '../dto/delete-many-byIds.dto';

// ============= TYPES =============

export type BaseRoute =
  | 'create'
  | 'getMany'
  | 'getPage'
  | 'getById'
  | 'getOne'
  | 'updateById'
  | 'updateByIds'
  | 'upsert'
  | 'getOneOrUpsert'
  | 'deleteById'
  | 'deleteByIds';

export interface RouteConfig {
  enabled?: boolean;
  roles?: string[];
  public?: boolean;
}

export interface CrudOptions {
  routes?: {
    [key in BaseRoute]?: boolean | RouteConfig;
  };
}

function ClassName<T>(name: string, cls: Type<T>): Type<T> {
  const newClass = class extends (cls as Type<object>) {};
  Object.defineProperty(newClass, 'name', { value: name });
  return newClass as Type<T>;
}

function normalizeRouteConfig(
  config: boolean | RouteConfig | undefined,
): RouteConfig {
  if (config === undefined || config === true) {
    return { enabled: true, roles: [], public: false };
  }
  if (config === false) {
    return { enabled: false, roles: [], public: false };
  }
  return {
    enabled: config.enabled !== false,
    roles: config.roles || [],
    public: config.public || false,
  };
}

// ============= API DECORATORS =============

/**
 * API decorator for condition query parameter
 */
export const ApiCondition = () =>
  ApiQuery({
    name: 'condition',
    required: false,
    type: String,
    description: 'Filter condition as JSON string, e.g., {"status":"active"}',
  });

/**
 * API decorators for query options
 */
export const ApiQueryOptions = (mode: 'one' | 'many' | 'page' = 'page') => {
  const decorators = [
    ApiQuery({
      name: 'select',
      required: false,
      type: String,
      description: 'Fields to select (comma-separated)',
    }),
    ApiQuery({
      name: 'populate',
      required: false,
      type: String,
      description: 'Relations to populate (comma-separated)',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description: 'Sort fields (prefix with - for desc)',
    }),
    ApiQuery({
      name: 'withDeleted',
      required: false,
      type: Boolean,
      description: 'Include soft-deleted records',
    }),
  ];

  if (mode === 'many') {
    decorators.push(
      ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limit results',
      }),
      ApiQuery({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Offset results',
      }),
    );
  }

  if (mode === 'page') {
    decorators.push(
      ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 10)',
      }),
    );
  }

  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    decorators.forEach((decorator) =>
      decorator(target, propertyKey, descriptor),
    );
  };
};

// ============= FACTORY =============

export interface ControllerFactoryOptions {
  conditionDto?: Type<unknown>;
  createDto?: Type<unknown>;
  updateDto?: Type<unknown>;
  routes?: CrudOptions['routes'];
}

/**
 * Base CRUD Controller Factory
 *
 * New signature:
 * @param entityType - Entity class
 * @param options - Factory options including DTOs and route configs
 *
 * Legacy signature (backward compatible):
 * @param entityType - Entity class
 * @param createDto - DTO for create operations
 * @param updateDto - DTO for update operations
 * @param options - Route configurations (CrudOptions)
 */
export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  optionsOrCreateDto?: ControllerFactoryOptions | Type<unknown>,
  updateDtoLegacy?: Type<unknown>,
  optionsLegacy?: CrudOptions,
) {
  // Detect if using new or legacy signature
  let conditionDto: Type<unknown> | undefined;
  let createDto: Type<unknown> | undefined;
  let updateDto: Type<unknown> | undefined;
  let options: CrudOptions | undefined;

  if (optionsOrCreateDto && 'routes' in optionsOrCreateDto) {
    // New signature: BaseCrudControllerFactory(entity, { conditionDto, createDto, updateDto, routes })
    const opts = optionsOrCreateDto;
    conditionDto = opts.conditionDto;
    createDto = opts.createDto;
    updateDto = opts.updateDto;
    options = { routes: opts.routes };
  } else if (
    optionsOrCreateDto &&
    typeof optionsOrCreateDto === 'function' &&
    updateDtoLegacy === undefined &&
    optionsLegacy === undefined
  ) {
    // Check if second param is CrudOptions (has routes property in prototype)
    // This handles: BaseCrudControllerFactory(entity, { routes: {...} })
    createDto = undefined;
    updateDto = undefined;
    options = optionsOrCreateDto as unknown as CrudOptions;
  } else {
    // Legacy signature: BaseCrudControllerFactory(entity, createDto, updateDto, options)
    createDto = optionsOrCreateDto as Type<unknown> | undefined;
    updateDto = updateDtoLegacy;
    options = optionsLegacy;
  }

  // Normalize route configs
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

  // Create DTOs with dynamic names
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

  // Create UpdateManyByIds DTO
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

  // Create validation pipes
  const createPipe = new AbstractValidationPipe(
    { whitelist: true },
    { body: CreateDto },
  );
  const updatePipe = new AbstractValidationPipe(
    { whitelist: true },
    { body: UpdateDto },
  );
  const updateManyByIdsPipe = new AbstractValidationPipe(
    { whitelist: true },
    { body: UpdateManyIdsDto },
  );
  const deleteManyByIdsPipe = new AbstractValidationPipe(
    { whitelist: true },
    { body: DeleteManyByIdsDto },
  );

  // ============= CONTROLLER CLASS =============

  abstract class BaseCrudControllerHost {
    constructor(
      public readonly service: BaseCrudService<E>,
      public readonly resourceName: string,
    ) {}

    // ============= CREATE =============

    @Post()
    @HttpCode(HTTP_STATUS.CREATED)
    @ApiCreatedResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.CREATED],
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    @UsePipes(createPipe)
    async create(
      @ReqUser() user: CurrentUserData,
      @Body() dto: Partial<E>,
    ): Promise<E> {
      if (!routeConfigs.create.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.create(user, dto);
    }

    // ============= READ - MANY =============

    @Get('many')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: [entityType],
    })
    @ApiCondition()
    @ApiQueryOptions('many')
    async getMany(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E[]> {
      if (!routeConfigs.getMany.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.getMany(user, condition, query as GetManyQuery<E>);
    }

    // ============= READ - PAGE =============

    @Get('page')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: PaginatedResponseDto,
    })
    @ApiCondition()
    @ApiQueryOptions('page')
    async getPage(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<PaginatedResponseDto<E>> {
      if (!routeConfigs.getPage.enabled) {
        throw new NotFoundException('Route not available');
      }
      const page = query.page || 1;
      const limit = query.limit || 10;
      return this.service.getPage(user, condition, {
        ...query,
        page,
        limit,
      } as GetPageQuery<E>);
    }

    // ============= READ - ONE =============

    @Get('one')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiCondition()
    @ApiQueryOptions('one')
    async getOne(
      @ReqUser() user: CurrentUserData,
      @RequestCondition(ConditionDto) condition: QueryCondition<E>,
      @RequestQuery() query: ParsedQueryOptions,
    ): Promise<E | null> {
      if (!routeConfigs.getOne.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.getOne(user, condition, query as GetOneQuery<E>);
    }

    // ============= READ - BY ID =============

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
      if (!routeConfigs.getById.enabled) {
        throw new NotFoundException('Route not available');
      }
      const item = await this.service.getById(
        user,
        id,
        query as GetOneQuery<E>,
      );
      if (!item) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
      return item;
    }

    // ============= UPDATE - BY ID =============

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
    @UsePipes(updatePipe)
    async updateById(
      @ReqUser() user: CurrentUserData,
      @Param('id') id: string,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      if (!routeConfigs.updateById.enabled) {
        throw new NotFoundException('Route not available');
      }
      const updated = await this.service.updateById(user, id, dto);
      if (!updated) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
      return updated;
    }

    // ============= UPDATE - BY IDS =============

    @Put('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: UpdateManyIdsDto })
    @UsePipes(updateManyByIdsPipe)
    async updateByIds(
      @ReqUser() user: CurrentUserData,
      @Body() dto: UpdateManyByIdsDto,
    ): Promise<{ affected: number }> {
      if (!routeConfigs.updateByIds.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.updateManyByIds(user, dto);
    }

    // ============= UPSERT =============

    @Post('upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(updatePipe)
    async upsert(
      @ReqUser() user: CurrentUserData,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      if (!routeConfigs.upsert.enabled) {
        throw new NotFoundException('Route not available');
      }
      const data = dto as Record<string, unknown>;
      const id = (data.id || data._id) as string | undefined;
      if (id) {
        const existing = await this.service.getById(user, id);
        if (existing) {
          const result = await this.service.updateById(user, id, dto);
          if (!result) {
            throw new NotFoundException(
              `${this.resourceName} with id ${id} not found`,
            );
          }
          return result;
        }
      }
      return this.service.create(user, dto as Partial<E>);
    }

    // ============= GET ONE OR UPSERT =============

    @Post('one/upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    @UsePipes(updatePipe)
    async getOneOrUpsert(
      @ReqUser() user: CurrentUserData,
      @Body() dto: UpdateData<E>,
    ): Promise<E> {
      if (!routeConfigs.getOneOrUpsert.enabled) {
        throw new NotFoundException('Route not available');
      }
      const upsertKeys = this.service.property?.upsertKeys || [];
      const data = dto as Record<string, unknown>;
      const condition: Record<string, unknown> = {};

      for (const key of upsertKeys) {
        if (data[key] !== undefined) {
          condition[key] = data[key];
        }
      }

      if (Object.keys(condition).length > 0) {
        const existing = await this.service.getOne(
          user,
          condition as QueryCondition<E>,
        );
        if (existing) {
          return existing;
        }
      }

      return this.service.create(user, dto as Partial<E>);
    }

    // ============= DELETE - BY ID =============

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
      if (!routeConfigs.deleteById.enabled) {
        throw new NotFoundException('Route not available');
      }
      const deleted = await this.service.deleteById(user, id);
      if (!deleted) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
    }

    // ============= DELETE - BY IDS =============

    @Delete('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK] })
    @ApiBody({ type: DeleteManyByIdsDto })
    @UsePipes(deleteManyByIdsPipe)
    async deleteByIds(
      @ReqUser() user: CurrentUserData,
      @Body() dto: DeleteManyByIdsDto,
    ): Promise<{ deleted: number }> {
      if (!routeConfigs.deleteByIds.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.deleteManyByIds(user, dto);
    }
  }

  // ============= APPLY AUTH DECORATORS =============

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

  return BaseCrudControllerHost;
}
