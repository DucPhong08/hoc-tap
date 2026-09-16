import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogQueueService } from '../services/audit-log-queue.service';
import {
  AUDITABLE_KEY,
  AuditableOptions,
} from '@/common/decorators/auditable.decorator';
import type { LogActionData } from '../constants/audit-log.constant';

interface AuditRequestContext {
  options: AuditableOptions;
  executionContext: ExecutionContext;
  user: any;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  result?: any;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private static readonly entityTypeCache = new Map<string, string>();

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogQueueService: AuditLogQueueService,
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

    const baseCtx: Omit<AuditRequestContext, 'result'> = {
      options: auditOptions,
      executionContext: context,
      user,
      ipAddress: this.getClientIp(request),
      userAgent: (request.headers['user-agent'] as string) || '',
      endpoint: request.url,
      method: request.method,
    };

    return next.handle().pipe(
      tap((result) => {
        this.dispatchAuditLog({ ...baseCtx, result });
      }),
      catchError((error) => {
        this.dispatchAuditLog(baseCtx);
        return throwError(() => error);
      }),
    );
  }

  private dispatchAuditLog(ctx: AuditRequestContext): void {
    try {
      const payload = this.buildLogPayload(ctx);
      this.auditLogQueueService.dispatch(payload);
    } catch (error) {
      this.logger.error('Audit log dispatch failed', error);
    }
  }

  private buildLogPayload(ctx: AuditRequestContext): LogActionData {
    return {
      action: ctx.options.action,
      entityType: this.extractEntityType(ctx.executionContext),
      entityId: this.extractEntityId(ctx.executionContext, ctx.result),
      userId: String(ctx.user.id ?? ctx.user.sub ?? 'unknown'),
      userEmail: ctx.user.email as string | undefined,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      endpoint: ctx.endpoint,
      method: ctx.method,
      description: ctx.options.description,
    };
  }

  private extractEntityId(context: ExecutionContext, result?: any): string {
    const request = context.switchToHttp().getRequest<any>();

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

    this.logger.debug(
      `Could not extract entityId for ${context.getClass().name}.${context.getHandler().name}, falling back to 'unknown'`,
    );
    return 'unknown';
  }

  private extractEntityType(context: ExecutionContext): string {
    const className = context.getClass().name;
    let entityType = AuditInterceptor.entityTypeCache.get(className);
    if (!entityType) {
      entityType = className
        .replace(/Controller$/, '')
        .replace(/([A-Z])/g, (match, p1, offset) =>
          offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase(),
        );
      AuditInterceptor.entityTypeCache.set(className, entityType);
    }
    return entityType;
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
