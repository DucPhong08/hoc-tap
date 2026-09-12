import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformResponse<T> {
  success: boolean;
  data: T;
}

export type Response<T> = TransformResponse<T>;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  TransformResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
