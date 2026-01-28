import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  NotFoundException,
  Type,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  OmitType,
} from '@nestjs/swagger';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { BaseEntity } from '../entity/base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../constants/http-status.constant';
import { Authorize } from '../decorators/authorize.decorator';
import { ReqUser } from '../decorators/request-user.decorator';
import type { CurrentUserData } from '../decorators/request-user.decorator';

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
  public?: boolean; // Route công khai, không cần auth
}

export interface CrudOptions {
  routes?: {
    [key in BaseRoute]?: boolean | RouteConfig;
  };
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
export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  create?: Type<any>,
  update?: Type<any>,
  options?: CrudOptions,
) {
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

  const CreateDto =
    create ||
    OmitType(entityType, ['_id', 'id', 'createdAt', 'updatedAt'] as const);
  const UpdateDto =
    update ||
    OmitType(entityType, ['_id', 'id', 'createdAt', 'updatedAt'] as const);

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
    async create(
      @ReqUser() _user: CurrentUserData,
      @Body() createDto: InstanceType<typeof CreateDto>,
    ): Promise<E> {
      if (!routeConfigs.create.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.create(createDto as Partial<E>);
    }

    @Get('many')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: [entityType],
    })
    async getMany(): Promise<E[]> {
      if (!routeConfigs.getMany.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.getMany();
    }

    @Get('page')
    @HttpCode(HTTP_STATUS.OK)
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: PaginatedResponseDto,
    })
    async getPage(
      @ReqUser() _user: CurrentUserData,
      @Query() pagination: PaginationDto,
    ): Promise<PaginatedResponseDto<E>> {
      if (!routeConfigs.getPage.enabled) {
        throw new NotFoundException('Route not available');
      }
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const result = await this.service.getPage({}, page, limit);
      return new PaginatedResponseDto(result.data, result.total, page, limit);
    }

    @Get('one')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    async getOne(): Promise<E | null> {
      if (!routeConfigs.getOne.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.getOne({});
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
    async getById(
      @ReqUser() _user: CurrentUserData,
      @Param('id') id: string,
    ): Promise<E> {
      if (!routeConfigs.getById.enabled) {
        throw new NotFoundException('Route not available');
      }
      const item = await this.service.getById(id);
      if (!item) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
      return item;
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
    async updateById(
      @ReqUser() _user: CurrentUserData,
      @Param('id') id: string,
      @Body() updateDto: InstanceType<typeof UpdateDto>,
    ): Promise<E> {
      if (!routeConfigs.updateById.enabled) {
        throw new NotFoundException('Route not available');
      }

      const updated = await this.service.updateById(
        id,
        updateDto as Partial<E>,
      );
      if (!updated) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
      return updated;
    }

    @Put('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
    })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          update: { type: 'object' },
        },
      },
    })
    async updateByIds(
      @ReqUser() _user: CurrentUserData,
      @Body() dto: { ids: string[]; update: Partial<E> },
    ): Promise<{ updated: number }> {
      if (!routeConfigs.updateByIds.enabled) {
        throw new NotFoundException('Route not available');
      }

      let updated = 0;
      for (const id of dto.ids) {
        const result = await this.service.updateById(id, dto.update);
        if (result) updated++;
      }

      return { updated };
    }

    @Post('upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    async upsert(
      @ReqUser() _user: CurrentUserData,
      @Body() dto: InstanceType<typeof UpdateDto>,
    ): Promise<E> {
      if (!routeConfigs.upsert.enabled) {
        throw new NotFoundException('Route not available');
      }

      const data = dto;
      if (data.id || data._id) {
        const id = data.id || data._id;
        const existing = await this.service.getById(id);
        if (existing) {
          const result = await this.service.updateById(id, data);
          if (!result) {
            throw new NotFoundException(
              `${this.resourceName} with id ${id} not found`,
            );
          }
          return result;
        }
      }

      return this.service.create(data);
    }

    @Post('one/upsert')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: entityType,
    })
    @ApiBody({ type: UpdateDto })
    async getOneOrUpsert(
      @ReqUser() _user: CurrentUserData,
      @Body() dto: InstanceType<typeof UpdateDto>,
    ): Promise<E> {
      if (!routeConfigs.getOneOrUpsert.enabled) {
        throw new NotFoundException('Route not available');
      }

      const existing = await this.service.getOne({});
      if (existing) {
        return existing;
      }

      return this.service.create(dto as Partial<E>);
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
      @ReqUser() _user: CurrentUserData,
      @Param('id') id: string,
    ): Promise<void> {
      if (!routeConfigs.deleteById.enabled) {
        throw new NotFoundException('Route not available');
      }

      const deleted = await this.service.deleteById(id);
      if (!deleted) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
    }

    @Delete('many/ids')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
    })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
        },
      },
    })
    async deleteByIds(
      @ReqUser() _user: CurrentUserData,
      @Body() dto: { ids: string[] },
    ): Promise<{ deleted: number }> {
      if (!routeConfigs.deleteByIds.enabled) {
        throw new NotFoundException('Route not available');
      }

      let deleted = 0;
      for (const id of dto.ids) {
        const result = await this.service.deleteById(id);
        if (result) deleted++;
      }

      return { deleted };
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

  applyAuthToRoute('create', routeConfigs.create);
  applyAuthToRoute('getMany', routeConfigs.getMany);
  applyAuthToRoute('getPage', routeConfigs.getPage);
  applyAuthToRoute('getById', routeConfigs.getById);
  applyAuthToRoute('getOne', routeConfigs.getOne);
  applyAuthToRoute('updateById', routeConfigs.updateById);
  applyAuthToRoute('updateByIds', routeConfigs.updateByIds);
  applyAuthToRoute('upsert', routeConfigs.upsert);
  applyAuthToRoute('getOneOrUpsert', routeConfigs.getOneOrUpsert);
  applyAuthToRoute('deleteById', routeConfigs.deleteById);
  applyAuthToRoute('deleteByIds', routeConfigs.deleteByIds);

  return BaseCrudControllerHost;
}
