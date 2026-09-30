import { ROLES_KEY } from '@/common/decorators/authorize.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { Role } from '@/common/constants/role.constant';
import {
  isReadRoute,
  resolveRouteRoles,
  setupAuthorization,
  getRouteConfigs,
  ROUTE_DEFINITIONS,
  READ_ROUTES,
  MANAGE_ROUTES,
} from './helpers';

describe('BaseController RBAC Helpers', () => {
  describe('isReadRoute', () => {
    it('should correctly identify read and manage routes', () => {
      READ_ROUTES.forEach((route) => {
        expect(isReadRoute(route)).toBe(true);
      });
      MANAGE_ROUTES.forEach((route) => {
        expect(isReadRoute(route)).toBe(false);
      });
    });
  });

  describe('resolveRouteRoles', () => {
    it('should default to [Role.ADMIN] when no options are provided', () => {
      expect(resolveRouteRoles('getPage', undefined)).toEqual([Role.ADMIN]);
      expect(resolveRouteRoles('create', undefined)).toEqual([Role.ADMIN]);
    });

    it('should use single role for all routes when 1 role is provided', () => {
      const options = { roles: [Role.USER] };
      expect(resolveRouteRoles('getPage', options)).toEqual([Role.USER]);
      expect(resolveRouteRoles('create', options)).toEqual([Role.USER]);
    });

    it('should partition read and manage roles when 2 roles are provided (co-curriculum pattern)', () => {
      const options = { roles: [Role.USER, Role.ADMIN] };
      expect(resolveRouteRoles('getPage', options)).toEqual([Role.USER]);
      expect(resolveRouteRoles('getMany', options)).toEqual([Role.USER]);
      expect(resolveRouteRoles('getById', options)).toEqual([Role.USER]);
      expect(resolveRouteRoles('getOne', options)).toEqual([Role.USER]);

      expect(resolveRouteRoles('create', options)).toEqual([Role.ADMIN]);
      expect(resolveRouteRoles('updateById', options)).toEqual([Role.ADMIN]);
      expect(resolveRouteRoles('deleteById', options)).toEqual([Role.ADMIN]);
    });

    it('should support object configuration { read, manage }', () => {
      const options = {
        roles: {
          read: [Role.USER, 'student'],
          manage: [Role.ADMIN, 'teacher'],
        },
      };
      expect(resolveRouteRoles('getPage', options)).toEqual([
        Role.USER,
        'student',
      ]);
      expect(resolveRouteRoles('deleteById', options)).toEqual([
        Role.ADMIN,
        'teacher',
      ]);
    });

    it('should prioritize explicit per-route role override', () => {
      const options = {
        roles: [Role.USER, Role.ADMIN],
        routes: {
          deleteById: {
            roles: ['super_admin'],
          },
        },
      };
      expect(resolveRouteRoles('getPage', options)).toEqual([Role.USER]);
      expect(resolveRouteRoles('deleteById', options)).toEqual(['super_admin']);
    });
  });

  describe('setupAuthorization', () => {
    class MockController {
      create() {}
      getMany() {}
      getPage() {}
      getById() {}
      getOne() {}
      updateOne() {}
      updateById() {}
      updateByIds() {}
      deleteOne() {}
      deleteById() {}
      deleteByIds() {}
    }

    it('should decorate methods and class with appropriate roles', () => {
      const routeConfigs = getRouteConfigs(undefined);
      setupAuthorization(MockController, ROUTE_DEFINITIONS, routeConfigs, {
        roles: [Role.USER, Role.ADMIN],
      });

      const classRoles: unknown = Reflect.getMetadata(
        ROLES_KEY,
        MockController,
      );
      expect(classRoles).toEqual(
        expect.arrayContaining([Role.USER, Role.ADMIN]),
      );

      const getPageRoles: unknown = Reflect.getMetadata(
        ROLES_KEY,
        MockController.prototype.getPage,
      );
      expect(getPageRoles).toEqual([Role.USER]);

      const createRoles: unknown = Reflect.getMetadata(
        ROLES_KEY,
        MockController.prototype.create,
      );
      expect(createRoles).toEqual([Role.ADMIN]);
    });

    it('should mark controller as Public when authorize: false', () => {
      class PublicController {
        getPage() {}
      }
      const routeConfigs = getRouteConfigs(undefined);
      setupAuthorization(
        PublicController,
        [{ route: 'getPage', handlerName: 'getPage' }],
        routeConfigs,
        { authorize: false },
      );

      const isPublic: unknown = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        PublicController,
      );
      expect(isPublic).toBe(true);
    });

    it('should mark specific route as Public when routeConfig.public: true', () => {
      class MixedController {
        getPage() {}
        create() {}
      }
      const routeConfigs = getRouteConfigs({
        getPage: { public: true },
      });
      setupAuthorization(
        MixedController,
        [
          { route: 'getPage', handlerName: 'getPage' },
          { route: 'create', handlerName: 'create' },
        ],
        routeConfigs,
        { roles: [Role.ADMIN] },
      );

      const isGetPagePublic: unknown = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        MixedController.prototype.getPage,
      );
      expect(isGetPagePublic).toBe(true);

      const createRoles: unknown = Reflect.getMetadata(
        ROLES_KEY,
        MixedController.prototype.create,
      );
      expect(createRoles).toEqual([Role.ADMIN]);
    });
  });
});
