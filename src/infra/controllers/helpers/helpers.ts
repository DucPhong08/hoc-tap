import { NotFoundException, Type } from '@nestjs/common';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { Auditable } from '@/common/decorators/auditable.decorator';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import { Role } from '@/common/enums/role.enum';
import type {
  BaseRoute,
  BaseControllerOptions,
  BaseRouteDefinition,
  RouteConfig,
} from './types';

export const ROUTE_DEFINITIONS: BaseRouteDefinition[] = [
  { route: 'create', handlerName: 'create' },
  { route: 'getMany', handlerName: 'getMany' },
  { route: 'getPage', handlerName: 'getPage' },
  { route: 'getById', handlerName: 'getById' },
  { route: 'getOne', handlerName: 'getOne' },
  { route: 'updateOne', handlerName: 'updateOne' },
  { route: 'updateById', handlerName: 'updateById' },
  { route: 'updateByIds', handlerName: 'updateByIds' },
  { route: 'deleteOne', handlerName: 'deleteOne' },
  { route: 'deleteById', handlerName: 'deleteById' },
  { route: 'deleteByIds', handlerName: 'deleteByIds' },
];

const BASE_AUDIT_ACTIONS: Partial<Record<BaseRoute, AuditAction>> = {
  create: AuditAction.CREATE,
  updateOne: AuditAction.UPDATE,
  updateById: AuditAction.UPDATE,
  updateByIds: AuditAction.UPDATE,
  deleteOne: AuditAction.DELETE,
  deleteById: AuditAction.DELETE,
  deleteByIds: AuditAction.DELETE,
};

export const toConfig = (config?: RouteConfig): Required<RouteConfig> => ({
  enabled: config?.enabled ?? true,
  roles: config?.roles ?? [],
});

export const getRouteConfigs = (
  routes: BaseControllerOptions['routes'] | undefined,
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

export const checkRouteEnabled = (config: RouteConfig): void => {
  if (!config.enabled) {
    throw new NotFoundException('error-route-not-available');
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
  routeDefinitions: BaseRouteDefinition[] = ROUTE_DEFINITIONS,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
  defaultRoles: string[] = [Role.ADMIN],
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
  routeDefinitions: BaseRouteDefinition[] = ROUTE_DEFINITIONS,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
): void {
  routeDefinitions.forEach(({ route, handlerName }) => {
    const action = BASE_AUDIT_ACTIONS[route];
    const routeConfig = routeConfigs[route];

    if (action && routeConfig.enabled) {
      decorate(controllerClass, handlerName, Auditable({ action }));
    }
  });
}

export function applyRouteMetadata(
  controllerClass: Type<object>,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
  defaultRoles: string[] = [Role.ADMIN],
): void {
  setupAuthorization(
    controllerClass,
    ROUTE_DEFINITIONS,
    routeConfigs,
    defaultRoles,
  );
  setupAudit(controllerClass, ROUTE_DEFINITIONS, routeConfigs);
}
