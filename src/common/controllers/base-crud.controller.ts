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
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseCrudService } from '../services/base-crud.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { BaseEntity } from '../base.entity';

export abstract class BaseCrudController<
  E extends BaseEntity,
  TCreateDto,
  TUpdateDto,
> {
  constructor(
    protected readonly service: BaseCrudService<E>,
    protected readonly resourceName: string,
  ) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Return all items' })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<E>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const result = await this.service.findAll({}, page, limit);
    return new PaginatedResponseDto(
      result.data,
      result.total,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return item' })
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
  @ApiResponse({ status: 201, description: 'Item created' })
  async create(@Body() createDto: TCreateDto): Promise<E> {
    return this.service.create(createDto as any);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: TUpdateDto,
  ): Promise<E> {
    const updated = await this.service.updateById(id, updateDto as any);
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
