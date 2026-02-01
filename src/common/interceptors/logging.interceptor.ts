import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`← ${method} ${url} ${duration}ms`);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - now;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`✗ ${method} ${url} ${duration}ms`, {
          error: errorMessage,
          stack: errorStack,
        });
        throw error;
      }),
    );
  }

  private sanitize(
    data: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!data) return data;
    const sensitive = ['password', 'token', 'secret', 'authorization'];
    const sanitized = { ...data };

    for (const key of sensitive) {
      if (key in sanitized) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
