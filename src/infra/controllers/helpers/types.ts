import type { Type } from '@nestjs/common';

export type BaseRoute =
  | 'create'
  | 'getMany'
  | 'getPage'
  | 'getById'
  | 'getOne'
  | 'updateOne'
  | 'updateById'
  | 'updateByIds'
  | 'deleteOne'
  | 'deleteById'
  | 'deleteByIds';

export type BaseHandlerName = BaseRoute;

export interface RouteConfig {
  enabled?: boolean;
  roles?: string[];
}

export interface BaseControllerOptions<C = unknown, U = unknown, CD = unknown> {
  defaultRoles?: string[];
  routes?: Partial<Record<BaseRoute, RouteConfig>>;
  dtos?: {
    create?: Type<C>;
    update?: Type<U>;
    condition?: Type<CD>;
  };
}

export type ControllerOptions<
  C = unknown,
  U = unknown,
  CD = unknown,
> = BaseControllerOptions<C, U, CD>;

export interface BaseRouteDefinition {
  route: BaseRoute;
  handlerName: BaseHandlerName;
}
