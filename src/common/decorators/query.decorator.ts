import { Query, Type } from '@nestjs/common';
import { RequestConditionPipe } from '../pipes/request-condition.pipe';
import { RequestQueryPipe } from '../pipes/request-query.pipe';

export const RequestQuery = () => Query(new RequestQueryPipe());
export const RequestCondition = <T>(schema: Type<T>) =>
  Query('condition', new RequestConditionPipe<T>(schema));
