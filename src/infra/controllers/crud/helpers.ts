import { Type, NotFoundException } from '@nestjs/common';
import { Authorize } from '../../../common/decorators/authorize.decorator';
import type {
  BaseRoute,
  ControllerFactoryOptions,
  CrudControllerFactoryConfig,
  CrudOptions,
  CrudRouteDefinition,
  RouteConfig,
} from './types';

export const renameGeneratedClass = <T>(
  name: string,
  cls: Type<T>,
): Type<T> => {
  const renamedClass = class extends (cls as Type<object>) {};
  Object.defineProperty(renamedClass, 'name', { value: name });
  return renamedClass as Type<T>;
};

export const normalizeRouteConfig = (
  config: boolean | RouteConfig | undefined,
): Required<RouteConfig> => {
  if (config === undefined || config === true) {
    return { enabled: true, roles: [] };
  }

  if (config === false) {
    return { enabled: false, roles: [] };
  }

  return {
    enabled: config.enabled !== false,
    roles: config.roles || [],
  };
};

export const buildRouteConfigMap = (
  routes: CrudOptions['routes'] | undefined,
): Record<BaseRoute, Required<RouteConfig>> => ({
  create: normalizeRouteConfig(routes?.create),
  getMany: normalizeRouteConfig(routes?.getMany),
  getPage: normalizeRouteConfig(routes?.getPage),
  getById: normalizeRouteConfig(routes?.getById),
  getOne: normalizeRouteConfig(routes?.getOne),
  updateOne: normalizeRouteConfig(routes?.updateOne),
  updateById: normalizeRouteConfig(routes?.updateById),
  updateByIds: normalizeRouteConfig(routes?.updateByIds),
  deleteOne: normalizeRouteConfig(routes?.deleteOne),
  deleteById: normalizeRouteConfig(routes?.deleteById),
  deleteByIds: normalizeRouteConfig(routes?.deleteByIds),
});

export const assertRouteEnabled = (config: RouteConfig): void => {
  if (!config.enabled) {
    throw new NotFoundException('Route not available');
  }
};

export function resolveCrudControllerFactoryConfig(
  optionsOrCreateDto?: ControllerFactoryOptions | Type<unknown>,
  updateDtoLegacy?: Type<unknown>,
  optionsLegacy?: CrudOptions,
): CrudControllerFactoryConfig {
  if (isControllerFactoryOptions(optionsOrCreateDto)) {
    return {
      conditionDto: optionsOrCreateDto.conditionDto,
      createDto: optionsOrCreateDto.createDto,
      updateDto: optionsOrCreateDto.updateDto,
      options: {
        defaultRoles: optionsOrCreateDto.defaultRoles,
        routes: optionsOrCreateDto.routes,
      },
    };
  }

  return {
    createDto: optionsOrCreateDto,
    updateDto: updateDtoLegacy,
    options: optionsLegacy ?? {},
  };
}

export function applyCrudAuthorization(
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
    if (!routeConfig.enabled) {
      return;
    }

    const handlerDescriptor = Object.getOwnPropertyDescriptor(
      controllerClass.prototype,
      handlerName,
    );

    if (!handlerDescriptor) {
      return;
    }

    Authorize(...routeConfig.roles)(
      controllerClass.prototype,
      handlerName,
      handlerDescriptor,
    );
  });
}

function isControllerFactoryOptions(
  value: ControllerFactoryOptions | Type<unknown> | undefined,
): value is ControllerFactoryOptions {
  return Boolean(value) && typeof value === 'object';
}
