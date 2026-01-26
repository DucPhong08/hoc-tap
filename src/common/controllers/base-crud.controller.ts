import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Type,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { BaseEntity } from '../base.entity';

export abstract class BaseCrudController<
  E extends BaseEntity,
  TCreateDto,
  TUpdateDto,
> {
  private entityType: Type<E>;
  private createDtoType: Type<TCreateDto>;
  private updateDtoType: Type<TUpdateDto>;

  constructor(
    protected readonly service: BaseCrudService<E>,
    protected readonly resourceName: string,
    entityType: Type<E>,
    createDtoType: Type<TCreateDto>,
    updateDtoType: Type<TUpdateDto>,
  ) {
    this.entityType = entityType;
    this.createDtoType = createDtoType;
    this.updateDtoType = updateDtoType;
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Return all items' })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<E>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const result = await this.service.findAll({}, page, limit);
    return new PaginatedResponseDto(result.data, result.total, page, limit);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id') id: string): Promise<E> {
    const item = await this.service.findById(id);
    if (!item) {
      throw new NotFoundException(
        `${this.resourceName} with id ${id} not found`,
      );
    }
    return item;
  }

  @Post()
  @ApiCreatedResponse({ description: 'Item created' })
  async create(@Body() createDto: TCreateDto): Promise<E> {
    return this.service.create(createDto as Partial<E>);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: TUpdateDto,
  ): Promise<E> {
    const updated = await this.service.updateById(id, updateDto as Partial<E>);
    if (!updated) {
      throw new NotFoundException(
        `${this.resourceName} with id ${id} not found`,
      );
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.service.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(
        `${this.resourceName} with id ${id} not found`,
      );
    }
  }
}
