import { NotFoundException, Type } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Authorize } from '@/common/decorators/authorize.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Auditable } from '@/common/decorators/auditable.decorator';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import { Role } from '@/common/constants/role.constant';
import type {
  BaseRoute,
  BaseControllerOptions,
  BaseRouteDefinition,
  ControllerRole,
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

export const READ_ROUTES: ReadonlyArray<BaseRoute> = [
  'getMany',
  'getPage',
  'getById',
  'getOne',
];

export const MANAGE_ROUTES: ReadonlyArray<BaseRoute> = [
  'create',
  'updateOne',
  'updateById',
  'updateByIds',
  'deleteOne',
  'deleteById',
  'deleteByIds',
];

export const isReadRoute = (route: BaseRoute): boolean =>
  READ_ROUTES.includes(route);

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
  authorize: config?.authorize ?? true,
  public: config?.public ?? false,
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
    throw new NotFoundException();
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

/**
 * Phân giải role cho từng route theo cơ chế phân quyền (tương tự co-curriculum):
 * 1. Nếu route cụ thể được cấu hình riêng trong options.routes[route].roles -> ưu tiên cao nhất.
 * 2. Nếu cấu hình dạng object { read?: [...], manage?: [...] }:
 *    - Route đọc (getMany, getPage, getById, getOne) -> read (mặc định Role.USER nếu rỗng)
 *    - Route ghi/quản trị (create, update, delete...) -> manage (mặc định Role.ADMIN nếu rỗng)
 * 3. Nếu cấu hình dạng mảng:
 *    - 1 phần tử [role]: tất cả các route đều dùng role này.
 *    - 2+ phần tử [readRole, manageRole, ...rest]:
 *      + Route đọc -> [readRole]
 *      + Route ghi/quản trị -> [manageRole, ...rest]
 * 4. Mặc định nếu không truyền: [Role.ADMIN] cho toàn bộ routes (an toàn & tương thích ngược).
 */
export const resolveRouteRoles = (
  route: BaseRoute,
  options?: BaseControllerOptions | ControllerRole[],
): ControllerRole[] => {
  if (Array.isArray(options)) {
    if (options.length === 0) return [Role.ADMIN];
    if (options.length === 1) return options;
    const [readRole, manageRole, ...rest] = options;
    return isReadRoute(route) ? [readRole] : [manageRole, ...rest];
  }

  // 1. Explicit per-route override
  const routeRoles = options?.routes?.[route]?.roles;
  if (routeRoles && routeRoles.length > 0) {
    return routeRoles;
  }

  const rolesOpt = options?.roles ?? options?.defaultRoles;

  if (rolesOpt) {
    // 2. Array format
    if (Array.isArray(rolesOpt)) {
      if (rolesOpt.length === 0) return [Role.ADMIN];
      if (rolesOpt.length === 1) return rolesOpt;
      const [readRole, manageRole, ...rest] = rolesOpt;
      return isReadRoute(route) ? [readRole] : [manageRole, ...rest];
    }

    // 3. Object format: { read?: [...], manage?: [...] }
    if (typeof rolesOpt === 'object') {
      if (isReadRoute(route)) {
        return rolesOpt.read ?? [Role.USER];
      }
      return rolesOpt.manage ?? [Role.ADMIN];
    }
  }

  // 4. Default fallback: Role.ADMIN
  return [Role.ADMIN];
};

export function setupAuthorization(
  controllerClass: Type<object>,
  routeDefinitions: BaseRouteDefinition[] = ROUTE_DEFINITIONS,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
  optionsOrRoles?: BaseControllerOptions | ControllerRole[],
): void {
  const options: BaseControllerOptions = Array.isArray(optionsOrRoles)
    ? { roles: optionsOrRoles }
    : (optionsOrRoles ?? {});

  // Controller-level authorization disabled
  if (options.authorize === false) {
    Public()(controllerClass);
    return;
  }

  const allDistinctRoles = new Set<string>();

  routeDefinitions.forEach(({ route, handlerName }) => {
    const routeConfig = routeConfigs[route];
    if (!routeConfig.enabled) {
      return;
    }

    // Route-level public bypass
    if (routeConfig.public || routeConfig.authorize === false) {
      decorate(controllerClass, handlerName, Public());
      return;
    }

    const routeRoles = resolveRouteRoles(route, options);
    if (routeRoles.length > 0) {
      routeRoles.forEach((r) => allDistinctRoles.add(String(r)));
      decorate(
        controllerClass,
        handlerName,
        Authorize(...(routeRoles as Role[])),
      );
    }
  });

  // Class-level decorator to allow all authorized roles to reach handler guards
  const classRoles =
    allDistinctRoles.size > 0
      ? (Array.from(allDistinctRoles) as Role[])
      : [Role.ADMIN];

  Authorize(...classRoles)(controllerClass);
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

export function setupSwaggerExclusion(
  controllerClass: Type<object>,
  routeDefinitions: BaseRouteDefinition[] = ROUTE_DEFINITIONS,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
): void {
  routeDefinitions.forEach(({ route, handlerName }) => {
    const routeConfig = routeConfigs[route];
    if (!routeConfig.enabled) {
      decorate(controllerClass, handlerName, ApiExcludeEndpoint());
    }
  });
}

export function applyRouteMetadata(
  controllerClass: Type<object>,
  routeConfigs: Record<BaseRoute, Required<RouteConfig>>,
  optionsOrRoles?: BaseControllerOptions | ControllerRole[],
): void {
  setupAuthorization(
    controllerClass,
    ROUTE_DEFINITIONS,
    routeConfigs,
    optionsOrRoles,
  );
  setupAudit(controllerClass, ROUTE_DEFINITIONS, routeConfigs);
  setupSwaggerExclusion(controllerClass, ROUTE_DEFINITIONS, routeConfigs);
}
