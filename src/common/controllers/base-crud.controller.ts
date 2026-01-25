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

export abstract class BaseCrudController<TModel, TCreateDto, TUpdateDto> {
  constructor(
    protected readonly service: BaseCrudService<TModel>,
    protected readonly resourceName: string,
  ) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Return all items' })
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<TModel>> {
    return this.service.findAll({}, pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id') id: string): Promise<TModel> {
    const item = await this.service.findOne(id);
    if (!item) {
      throw new NotFoundException(
        `${this.resourceName} with id ${id} not found`,
      );
    }
    return item;
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Item created' })
  async create(@Body() createDto: TCreateDto): Promise<TModel> {
    return this.service.create(createDto as any);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: TUpdateDto,
  ): Promise<TModel> {
    return this.service.update(id, updateDto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
