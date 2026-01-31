import { Type } from '@nestjs/common';

export type BaseRoute =
  | 'create'
  | 'getMany'
  | 'getPage'
  | 'getById'
  | 'getOne'
  | 'updateById'
  | 'updateByIds'
  | 'upsert'
  | 'getOneOrUpsert'
  | 'deleteById'
  | 'deleteByIds';

export interface RouteConfig {
  enabled?: boolean;
  roles?: string[];
  public?: boolean;
}

export interface CrudOptions {
  defaultRoles?: string[];
  routes?: {
    [key in BaseRoute]?: boolean | RouteConfig;
  };
}

export interface ControllerFactoryOptions {
  conditionDto?: Type<unknown>;
  createDto?: Type<unknown>;
  updateDto?: Type<unknown>;
  routes?: CrudOptions['routes'];
}
