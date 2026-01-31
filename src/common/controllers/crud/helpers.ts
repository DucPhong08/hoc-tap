import { Type, NotFoundException } from '@nestjs/common';
import type { RouteConfig } from './types';

export const ClassName = <T>(name: string, cls: Type<T>): Type<T> => {
  const newClass = class extends (cls as Type<object>) {};
  Object.defineProperty(newClass, 'name', { value: name });
  return newClass as Type<T>;
};

export const normalizeRouteConfig = (
  config: boolean | RouteConfig | undefined,
): RouteConfig => {
  if (config === undefined || config === true) {
    return { enabled: true, roles: [], public: false };
  }
  if (config === false) {
    return { enabled: false, roles: [], public: false };
  }
  return {
    enabled: config.enabled !== false,
    roles: config.roles || [],
    public: config.public || false,
  };
};

export const checkRouteEnabled = (config: RouteConfig): void => {
  if (!config.enabled) {
    throw new NotFoundException('Route not available');
  }
};

export const notFoundError = (resourceName: string, id?: string): never => {
  const message = id
    ? `${resourceName} với ID ${id} không tìm thấy`
    : `${resourceName} không tìm thấy`;
  throw new NotFoundException(message);
};
