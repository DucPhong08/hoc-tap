import { Query, Type } from '@nestjs/common';
import { ConditionQueryPipe, QueryOptionsPipe } from '../pipes';

export const RequestQuery = () => Query(new QueryOptionsPipe());
export const RequestCondition = <T>(schema: Type<T>) =>
  Query('condition', new ConditionQueryPipe<T>(schema));
