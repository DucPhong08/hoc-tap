import { Type } from '@nestjs/common';

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

export type CrudHandlerName =
  | 'createEntity'
  | 'listEntities'
  | 'paginateEntities'
  | 'findOneByCondition'
  | 'findEntityById'
  | 'updateOneByCondition'
  | 'updateEntityById'
  | 'updateEntitiesByIds'
  | 'deleteOneByCondition'
  | 'deleteEntityById'
  | 'deleteEntitiesByIds';

export interface RouteConfig {
  enabled?: boolean;
  roles?: string[];
}

export interface CrudOptions {
  defaultRoles?: string[];
  routes?: {
    [key in BaseRoute]?: boolean | RouteConfig;
  };
}

export interface ControllerFactoryOptions extends CrudOptions {
  conditionDto?: Type<unknown>;
  createDto?: Type<unknown>;
  updateDto?: Type<unknown>;
}

export interface CrudRouteDefinition {
  route: BaseRoute;
  handlerName: CrudHandlerName;
}

export interface CrudControllerFactoryConfig {
  conditionDto?: Type<unknown>;
  createDto?: Type<unknown>;
  updateDto?: Type<unknown>;
  options: CrudOptions;
}
