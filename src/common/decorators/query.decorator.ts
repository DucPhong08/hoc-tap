import { Query, Type } from '@nestjs/common';
import { ConditionQueryPipe } from '../pipes/request-condition.pipe';
import { QueryOptionsPipe } from '../pipes/request-query.pipe';

export const RequestQuery = () => Query(new QueryOptionsPipe());
export const RequestCondition = <T>(schema: Type<T>, required = false) =>
  Query('condition', new ConditionQueryPipe<T>(schema, required));
