import {
  Get,
  HttpCode,
  HttpStatus,
  Type,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { ReferenceObject, SchemaObject } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/pagination.dto';

type QueryMode = 'one' | 'many' | 'page';

export const ApiDataResponse = (
  data: SchemaObject | ReferenceObject,
  status = HttpStatus.OK,
) =>
  ApiResponse({
    status,
    description: status === HttpStatus.CREATED ? 'Created' : 'OK',
    schema: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', enum: [true] },
        data,
      },
    },
  });

export const ApiCondition = (required = false) =>
  ApiQuery({
    name: 'condition',
    required,
    type: String,
  });

export const ApiQueryOptions = (mode: QueryMode) => {
  const decorators = [
    ApiQuery({
      name: 'select',
      required: false,
      type: String,
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description: '1: tăng dần, -1: giảm dần',
    }),
  ];

  if (mode === 'page') {
    decorators.push(
      ApiQuery({
        name: 'page',
        required: false,
        default: 1,
        type: Number,
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        default: 10,
        type: Number,
      }),
    );
  }

  return applyDecorators(...decorators);
};

export const ApiGet = (mode: QueryMode, entityType: Type<unknown>) => {
  const entity = { $ref: getSchemaPath(entityType) };
  const getOkResponse = () => {
    switch (mode) {
      case 'page':
        return ApiDataResponse({
          allOf: [
            { $ref: getSchemaPath(PaginatedResponseDto) },
            {
              type: 'object',
              required: ['data'],
              properties: { data: { type: 'array', items: entity } },
            },
          ],
        });
      case 'many':
        return ApiDataResponse({ type: 'array', items: entity });
      case 'one':
        return ApiDataResponse({
          oneOf: [entity, { type: 'object', nullable: true, enum: [null] }],
        });
    }
  };

  return applyDecorators(
    Get(mode),
    HttpCode(HttpStatus.OK),
    ApiExtraModels(entityType, PaginatedResponseDto),
    getOkResponse(),
    ApiCondition(mode === 'one'),
    ApiQueryOptions(mode),
  );
};
