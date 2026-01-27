import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  NotFoundException,
  Type,
  UseGuards,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  OmitType,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { BaseEntity } from '../base.entity';
import { HTTP_STATUS } from '../constants/http-status.constant';

export interface RouteConfig {
  enabled?: boolean;
  authorize?: boolean;
  roles?: string[];
}

export interface CrudOptions {
  routes?: {
    getMany?: boolean | RouteConfig;
    getPage?: boolean | RouteConfig;
    getOne?: boolean | RouteConfig;
    create?: boolean | RouteConfig;
    update?: boolean | RouteConfig;
    delete?: boolean | RouteConfig;
  };

  guards?: {
    authorize?: Type<any>;
    roles?: Type<any>;
  };
}

// Helper để normalize route config
function normalizeRouteConfig(
  config: boolean | RouteConfig | undefined,
): RouteConfig {
  if (config === undefined || config === true) {
    return { enabled: true, authorize: false, roles: [] };
  }
  if (config === false) {
    return { enabled: false, authorize: false, roles: [] };
  }
  return {
    enabled: config.enabled !== false,
    authorize: config.authorize || false,
    roles: config.roles || [],
  };
}

export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  create?: Type<any>,
  update?: Type<any>,
  options?: CrudOptions,
) {
  // Normalize all route configs
  const routeConfigs = {
    getMany: normalizeRouteConfig(options?.routes?.getMany),
    getPage: normalizeRouteConfig(options?.routes?.getPage),
    getOne: normalizeRouteConfig(options?.routes?.getOne),
    create: normalizeRouteConfig(options?.routes?.create),
    update: normalizeRouteConfig(options?.routes?.update),
    delete: normalizeRouteConfig(options?.routes?.delete),
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

    @Get()
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({
      description: 'Return all items without pagination',
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
      description: 'Return paginated items',
      type: PaginatedResponseDto,
    })
    async getPage(
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

    @Get(':id')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: 'Return item', type: entityType })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: 'Item not found',
    })
    async findOne(@Param('id') id: string): Promise<E> {
      if (!routeConfigs.getOne.enabled) {
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

    @Post()
    @HttpCode(HTTP_STATUS.CREATED)
    @ApiCreatedResponse({ description: 'Item created', type: entityType })
    @ApiBody({ type: CreateDto })
    async create(
      @Body() createDto: InstanceType<typeof CreateDto>,
    ): Promise<E> {
      if (!routeConfigs.create.enabled) {
        throw new NotFoundException('Route not available');
      }
      return this.service.create(createDto as Partial<E>);
    }

    @Patch(':id')
    @HttpCode(HTTP_STATUS.OK)
    @ApiOkResponse({ description: 'Item updated', type: entityType })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: 'Item not found',
    })
    @ApiBody({ type: UpdateDto })
    async update(
      @Param('id') id: string,
      @Body() updateDto: InstanceType<typeof UpdateDto>,
    ): Promise<E> {
      if (!routeConfigs.update.enabled) {
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

    @Delete(':id')
    @HttpCode(HTTP_STATUS.NO_CONTENT)
    @ApiResponse({
      status: HTTP_STATUS.NO_CONTENT,
      description: 'Item deleted',
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: 'Item not found',
    })
    async deleteById(@Param('id') id: string): Promise<void> {
      if (!routeConfigs.delete.enabled) {
        throw new NotFoundException('Route not available');
      }

      const deleted = await this.service.deleteById(id);
      if (!deleted) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
    }
  }

  const applyGuardsToRoute = (methodName: string, config: RouteConfig) => {
    if (!config.authorize || !options?.guards?.authorize) return;

    const guards: Type<any>[] = [options.guards.authorize];

    if (config.roles && config.roles.length > 0 && options.guards?.roles) {
      guards.push(options.guards.roles);
    }

    UseGuards(...guards)(
      BaseCrudControllerHost.prototype,
      methodName,
      Object.getOwnPropertyDescriptor(
        BaseCrudControllerHost.prototype,
        methodName,
      )!,
    );

    ApiBearerAuth()(
      BaseCrudControllerHost.prototype,
      methodName,
      Object.getOwnPropertyDescriptor(
        BaseCrudControllerHost.prototype,
        methodName,
      )!,
    );

    if (config.roles && config.roles.length > 0) {
      Reflect.defineMetadata(
        'roles',
        config.roles,
        BaseCrudControllerHost.prototype[methodName],
      );
    }
  };

  applyGuardsToRoute('getMany', routeConfigs.getMany);
  applyGuardsToRoute('getPage', routeConfigs.getPage);
  applyGuardsToRoute('findOne', routeConfigs.getOne);
  applyGuardsToRoute('create', routeConfigs.create);
  applyGuardsToRoute('update', routeConfigs.update);
  applyGuardsToRoute('deleteById', routeConfigs.delete);

  return BaseCrudControllerHost;
}
