import {
  Get,
  HttpCode,
  HttpStatus,
  Type,
  applyDecorators,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/pagination.dto';

type QueryMode = 'one' | 'many' | 'page';

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
  const getOkResponse = () => {
    switch (mode) {
      case 'page':
        return ApiOkResponse({ type: PaginatedResponseDto });
      case 'many':
        return ApiOkResponse({ type: entityType, isArray: true });
      case 'one':
        return ApiOkResponse({ type: entityType });
    }
  };

  return applyDecorators(
    Get(mode),
    HttpCode(HttpStatus.OK),
    getOkResponse(),
    ApiCondition(mode === 'one'),
    ApiQueryOptions(mode),
  );
};
