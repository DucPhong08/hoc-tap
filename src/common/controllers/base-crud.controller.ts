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
import { BaseEntity } from '../base.entity';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../constants/http-status.constant';

// Mixin function để tạo base controller với proper Swagger decorators
export function BaseCrudControllerFactory<E extends BaseEntity>(
  entityType: Type<E>,
  options?: {
    createDtoType?: Type<any>;
    updateDtoType?: Type<any>;
  },
) {
  const CreateDto =
    options?.createDtoType ||
    OmitType(entityType, ['_id', 'id', 'createdAt', 'updatedAt'] as const);
  const UpdateDto =
    options?.updateDtoType ||
    OmitType(entityType, ['_id', 'id', 'createdAt', 'updatedAt'] as const);

  abstract class BaseCrudControllerHost {
    constructor(
      public readonly service: BaseCrudService<E>,
      public readonly resourceName: string,
    ) {}

    @Get()
    @HttpCode(HTTP_STATUS.OK)
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
      type: PaginatedResponseDto,
    })
    async findAll(
      @Query() pagination: PaginationDto,
    ): Promise<PaginatedResponseDto<E>> {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const result = await this.service.getMany({}, page, limit);
      return new PaginatedResponseDto(result.data, result.total, page, limit);
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
    async findOne(@Param('id') id: string): Promise<E> {
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
    @ApiCreatedResponse({
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.CREATED],
      type: entityType,
    })
    @ApiBody({ type: CreateDto })
    async create(
      @Body() createDto: InstanceType<typeof CreateDto>,
    ): Promise<E> {
      return this.service.create(createDto as Partial<E>);
    }

    @Patch(':id')
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
    async update(
      @Param('id') id: string,
      @Body() updateDto: InstanceType<typeof UpdateDto>,
    ): Promise<E> {
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
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NO_CONTENT],
    })
    @ApiResponse({
      status: HTTP_STATUS.NOT_FOUND,
      description: HTTP_STATUS_MESSAGE[HTTP_STATUS.NOT_FOUND],
    })
    async remove(@Param('id') id: string): Promise<void> {
      const deleted = await this.service.deleteById(id);
      if (!deleted) {
        throw new NotFoundException(
          `${this.resourceName} with id ${id} not found`,
        );
      }
    }
  }

  return BaseCrudControllerHost;
}
