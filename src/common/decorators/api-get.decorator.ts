import { Get, HttpCode, Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/pagination.dto';
import { HTTP_STATUS } from '../constants/http-status.constant';

// Matches FindQuery modes: getOne, getMany, getPage
type QueryMode = 'one' | 'many' | 'page';

const ApiCondition = () =>
  ApiQuery({
    name: 'condition',
    required: false,
    type: String,
  });

export const ApiQueryOptions = (mode: QueryMode) => {
  const decorators = [
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description: '1: tăng dần, -1: giảm dần',
    }),
    ApiQuery({
      name: 'withDeleted',
      required: false,
      type: Boolean,
    }),
  ];

  if (mode === 'many') {
    decorators
      .push
      // ApiQuery({
      //   name: 'limit',
      //   required: false,
      //   type: Number,
      // }),
      // ApiQuery({
      //   name: 'offset',
      //   required: false,
      //   type: Number,
      // }),
      ();
  }

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
  const routePath = mode === 'one' ? 'one' : mode === 'many' ? 'many' : 'page';

  const apiOkResponse =
    mode === 'page'
      ? ApiOkResponse({
          type: PaginatedResponseDto,
        })
      : mode === 'many'
        ? ApiOkResponse({
            type: entityType,
            isArray: true,
          })
        : ApiOkResponse({
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
