import { Get, HttpCode, Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/pagination.dto';
import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGE,
} from '../constants/http-status.constant';

type QueryMode = 'one' | 'many' | 'page';

const ApiCondition = () =>
  ApiQuery({
    name: 'condition',
    required: false,
    type: String,
    description: 'Filter condition as JSON string',
  });

export const ApiQueryOptions = (mode: QueryMode) => {
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

  return applyDecorators(...decorators);
};

export const ApiGet = (mode: QueryMode, entityType: Type<unknown>) => {
  const routePath = mode === 'one' ? 'one' : mode === 'many' ? 'many' : 'page';

  const apiOkResponse =
    mode === 'page'
      ? ApiOkResponse({
          description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
          type: PaginatedResponseDto,
        })
      : mode === 'many'
        ? ApiOkResponse({
            description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
            type: entityType,
            isArray: true,
          })
        : ApiOkResponse({
            description: HTTP_STATUS_MESSAGE[HTTP_STATUS.OK],
            type: entityType,
          });

  return applyDecorators(
    Get(routePath),
    HttpCode(HTTP_STATUS.OK),
    apiOkResponse,
    ApiCondition(),
    ApiQueryOptions(mode),
  );
};
