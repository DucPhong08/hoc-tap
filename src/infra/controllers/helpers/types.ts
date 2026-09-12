import type { Type } from '@nestjs/common';
import type { Role } from '@/common/constants/role.constant';

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
  roles?: Role[];
}

export interface BaseControllerOptions<C = unknown, U = unknown, CD = unknown> {
  defaultRoles?: Role[];
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
