import { Type } from '@nestjs/common';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { Auditable } from '@/common/decorators/auditable.decorator';
import { ApiError } from '@/common/exceptions/api-error';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import type {
  BaseRoute,
  CrudOptions,
  CrudRouteDefinition,
  RouteConfig,
} from './types';

const CRUD_AUDIT_ACTIONS: Partial<Record<BaseRoute, AuditAction>> = {
  create: AuditAction.CREATE,
  updateOne: AuditAction.UPDATE,
  updateById: AuditAction.UPDATE,
  updateByIds: AuditAction.UPDATE,
  deleteOne: AuditAction.DELETE,
  deleteById: AuditAction.DELETE,
  deleteByIds: AuditAction.DELETE,
};

export const toConfig = (
  config: boolean | RouteConfig | undefined,
): Required<RouteConfig> => ({
  enabled: typeof config === 'boolean' ? config : (config?.enabled ?? true),
  roles: typeof config === 'boolean' ? [] : (config?.roles ?? []),
});

export const getRouteConfigs = (
  routes: CrudOptions['routes'] | undefined,
): Record<BaseRoute, Required<RouteConfig>> => ({
  create: toConfig(routes?.create),
  getMany: toConfig(routes?.getMany),
  getPage: toConfig(routes?.getPage),
  getById: toConfig(routes?.getById),
  getOne: toConfig(routes?.getOne),
  updateOne: toConfig(routes?.updateOne),
  updateById: toConfig(routes?.updateById),
  updateByIds: toConfig(routes?.updateByIds),
  deleteOne: toConfig(routes?.deleteOne),
  deleteById: toConfig(routes?.deleteById),
  deleteByIds: toConfig(routes?.deleteByIds),
});

export const assertRouteEnabled = (config: RouteConfig): void => {
  if (!config.enabled) {
    throw ApiError.NotFound('error-route-not-available');
  }
};

const decorate = (
  targetClass: Type<object>,
  handlerName: string,
  decorator: MethodDecorator,
): void => {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetClass.prototype,
    handlerName,
  );
  if (descriptor) {
    decorator(targetClass.prototype as object, handlerName, descriptor);
  }
};

export function setupAuthorization(
  controllerClass: Type<object>,
  routeDefinitions: CrudRouteDefinition[],
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
  defaultRoles: string[] = [],
): void {
  const classDecorator =
    defaultRoles.length > 0 ? Authorize(...defaultRoles) : Authorize();
  classDecorator(controllerClass);

  routeDefinitions.forEach(({ route, handlerName }) => {
    const routeConfig = routeConfigs[route];
    if (routeConfig.enabled && routeConfig.roles.length > 0) {
      decorate(controllerClass, handlerName, Authorize(...routeConfig.roles));
    }
  });
}

export function setupAudit(
  controllerClass: Type<object>,
  routeDefinitions: CrudRouteDefinition[],
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
): void {
  routeDefinitions.forEach(({ route, handlerName }) => {
    const action = CRUD_AUDIT_ACTIONS[route];
    const routeConfig = routeConfigs[route];

    if (action && routeConfig.enabled) {
      decorate(controllerClass, handlerName, Auditable({ action }));
    }
  });
}
