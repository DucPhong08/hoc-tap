import { Role } from '../../../modules/users/constant/constant';

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
  roles?: Role[];
}

export interface CrudOptions {
  defaultRoles?: Role[];
  routes?: {
    [key in BaseRoute]?: boolean | RouteConfig;
  };
}

export interface CrudRouteDefinition {
  route: BaseRoute;
  handlerName: CrudHandlerName;
}
