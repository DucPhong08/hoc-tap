import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  AUDIT_LOG_KEY,
  AUDIT_LOG_METADATA,
  AuditLogProps,
  LogActionData,
} from '../constants/audit-log.constant';
import { AuditLogQueueService } from '../services/audit-log-queue.service';

interface AuditableUser {
  id?: string;
  _id?: string;
  username?: string;
  code?: string;
  fullname?: string;
  name?: string;
  email?: string;
  getUser?: () => Promise<AuditableUser> | AuditableUser;
}

interface AuditableRequest extends Request {
  user?: AuditableUser;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogQueueService: AuditLogQueueService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const props = this.reflector.getAllAndOverride<AuditLogProps>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!props) {
      return next.handle();
    }

    const log = await this.buildBaseLog(context, props);
    if (!log) {
      return next.handle();
    }

    if (props.logResponse === false) {
      this.auditLogQueueService.dispatch(log);
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const meta = this.resolveMetadata(data, context);
        if (meta) {
          Object.assign(log, meta, {
            metadata: { ...(log.metadata || {}), ...(meta.metadata || {}) },
          });
        }

        if (props.logResponse) {
          log.response = data;
        }

        this.auditLogQueueService.dispatch(log);
        return this.stripInternalMetadata(data);
      }),
      catchError((err) => {
        if (props.logError) {
          log.error = err;
          this.auditLogQueueService.dispatch(log);
        }
        throw err;
      }),
    );
  }

  private async buildBaseLog(
    context: ExecutionContext,
    props: AuditLogProps,
  ): Promise<LogActionData | null> {
    const type = context.getType<'http' | 'rpc'>();

    if (type === 'http') {
      return this.buildHttpLog(context, props);
    }

    if (type === 'rpc') {
      return this.buildRpcLog(context, props);
    }

    return null;
  }

  /** Field override dùng chung cho cả http lẫn rpc, tránh lặp code giữa 2 nhánh. */
  private buildCommonOverrides(props: AuditLogProps) {
    return {
      sourceId: props.sourceId,
      uCode: props.uCode,
      uName: props.uName,
      uEmail: props.uEmail,
      description: props.description,
      metadata: { ...(props.metadata || {}) },
    };
  }

  private async buildHttpLog(
    context: ExecutionContext,
    props: AuditLogProps,
  ): Promise<LogActionData> {
    const req = context.switchToHttp().getRequest<AuditableRequest>();
    const user = await this.resolveUser(req.user);
    const ip = this.resolveIp(req);

    return {
      ...this.buildCommonOverrides(props),
      action: props.action || this.defaultHttpAction(req),
      entityType: context
        .getClass()
        .name.replace(/Controller$/, '')
        .toLowerCase(),
      entityId:
        (req.params as any)?.id || req.body?.id || props.sourceId || 'unknown',
      uId: String(props.uId || user?.id || user?._id || 'unknown'),
      uCode: props.uCode || user?.username || user?.code,
      uName: props.uName || user?.fullname || user?.name,
      uEmail: props.uEmail || user?.email,
      requestType: 'http',
      ipAddress: ip,
      userAgent: (req.headers['user-agent'] as string) || '',
      endpoint: req.originalUrl || req.url,
      method: req.method,
      data: req.body,
      query: req.query,
      param: req.params,
    };
  }

  private buildRpcLog(
    context: ExecutionContext,
    props: AuditLogProps,
  ): LogActionData {
    const rpc = context.switchToRpc();

    return {
      ...this.buildCommonOverrides(props),
      action: props.action || 'RPC_ACTION',
      uId: String(props.uId || 'unknown'),
      requestType: 'rpc',
      data: {
        context: rpc.getContext(),
        data: rpc.getData(),
      },
    };
  }

  private defaultHttpAction(req: AuditableRequest): string {
    return `${req.method} ${req.baseUrl || ''}${req.path || req.url || ''}`.toLowerCase();
  }

  private resolveIp(req: Request): string {
    return (
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  private async resolveUser(
    rawUser: AuditableUser | undefined,
  ): Promise<AuditableUser | undefined> {
    if (typeof rawUser?.getUser === 'function') {
      return rawUser.getUser();
    }
    return rawUser;
  }

  private resolveMetadata(data: any, context: ExecutionContext): any {
    if (data && typeof data === 'object' && AUDIT_LOG_METADATA in data) {
      return data[AUDIT_LOG_METADATA];
    }
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<any>()?.[AUDIT_LOG_METADATA];
    }
    return undefined;
  }

  /** Trả về bản sao không còn field metadata nội bộ, thay vì mutate `data` gốc. */
  private stripInternalMetadata<T>(data: T): T {
    if (
      data &&
      typeof data === 'object' &&
      AUDIT_LOG_METADATA in (data as any)
    ) {
      const clone: any = { ...(data as any) };
      delete clone[AUDIT_LOG_METADATA];
      return clone;
    }
    return data;
  }
}

export { AuditInterceptor as AuditLogInterceptor };
