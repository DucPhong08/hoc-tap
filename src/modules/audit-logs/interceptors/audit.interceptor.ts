import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';
import {
  AUDITABLE_KEY,
  AuditableOptions,
} from '@/common/decorators/auditable.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditableOptions>(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const ipAddress = this.getClientIp(request);
    const userAgent = (request.headers as any)['user-agent'] as string;
    const endpoint = (request as any).url as string;
    const method = (request as any).method as string;

    return next.handle().pipe(
      tap((result) => {
        // Fire and forget - không await
        void this.logAuditSuccess(
          auditOptions,
          context,
          user,
          ipAddress,
          userAgent,
          endpoint,
          method,
          result,
        );
      }),
      catchError((error) => {
        void this.logFailedOperation(
          auditOptions,
          context,
          user,
          ipAddress,
          userAgent,
          endpoint,
          method,
        );
        return throwError(() => error);
      }),
    );
  }

  private async logAuditSuccess(
    auditOptions: AuditableOptions,
    context: ExecutionContext,
    user: any,
    ipAddress: string,
    userAgent: string,
    endpoint: string,
    method: string,
    result?: any,
  ): Promise<void> {
    try {
      const entityId = this.extractEntityId(context, result);
      const entityType = this.extractEntityType(context);

      await this.auditLogService.log({
        action: auditOptions.action,
        entityType,
        entityId,
        userId: (user.id || user.sub) as string,
        userEmail: user.email as string,
        ipAddress,
        userAgent,
        endpoint,
        method,
        description: auditOptions.description,
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  private async logFailedOperation(
    options: AuditableOptions,
    context: ExecutionContext,
    user: any,
    ipAddress: string,
    userAgent: string,
    endpoint: string,
    method: string,
  ): Promise<void> {
    try {
      const entityId = this.extractEntityId(context);
      const entityType = this.extractEntityType(context);

      await this.auditLogService.log({
        action: options.action,
        entityType,
        entityId,
        userId: (user.id || user.sub) as string,
        userEmail: user.email as string,
        ipAddress,
        userAgent,
        endpoint,
        method,
        description: options.description,
      });
    } catch (error) {
      console.error('Failed operation audit logging failed:', error);
    }
  }

  private extractEntityId(context: ExecutionContext, result?: any): string {
    const request = context.switchToHttp().getRequest<any>();
    const args = context.getArgs().slice(2);

    // 1. Từ URL params (:id)
    if (request.params?.id) {
      return String(request.params.id);
    }

    // 2. Từ body.id
    if (request.body?.id) {
      return String(request.body.id);
    }

    // 3. Từ body.email
    if (request.body?.email) {
      return String(request.body.email);
    }

    // 4. Từ result (nếu create)
    if (result?.id) {
      return String(result.id);
    }

    if (result?.email) {
      return String(result.email);
    }

    // 5. Argument đầu tiên
    if (args[0]) {
      if (typeof args[0] === 'string') {
        return args[0];
      }
      if (args[0].id) {
        return String(args[0].id);
      }
      if (args[0].email) {
        return String(args[0].email);
      }
    }

    return 'unknown';
  }

  private extractEntityType(context: ExecutionContext): string {
    const className = context.getClass().name;
    return className
      .replace(/Controller$/, '')
      .replace(/([A-Z])/g, (match, p1, offset) =>
        offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase(),
      );
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-client-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
