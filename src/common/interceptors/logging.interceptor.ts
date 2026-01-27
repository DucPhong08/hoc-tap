import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const now = Date.now();

    this.logger.log(`→ ${method} ${url}`, {
      body: this.sanitize(body),
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`← ${method} ${url} ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(`✗ ${method} ${url} ${duration}ms`, {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }),
    );
  }

  private sanitize(data: any): any {
    if (!data) return data;
    const sensitive = ['password', 'token', 'secret', 'authorization'];
    const sanitized = { ...data };

    for (const key of sensitive) {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
