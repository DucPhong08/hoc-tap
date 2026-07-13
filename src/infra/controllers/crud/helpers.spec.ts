import { SystemRole } from '@/modules/roles/enums/system-role.enum';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import type { CrudRouteDefinition } from './types';
import { getRouteConfigs, setupAuthorization } from './helpers';

const ROUTES: CrudRouteDefinition[] = [
  { route: 'getMany', handlerName: 'listEntities' },
];

describe('CRUD authorization metadata', () => {
  it('inherits controller roles when a route has no override', () => {
    class TestController {
      listEntities(this: void): void {}
    }

    const configs = getRouteConfigs(undefined);
    setupAuthorization(TestController, ROUTES, configs, [SystemRole.USER]);

    expect(Reflect.getMetadata(ROLES_KEY, TestController)).toEqual([
      SystemRole.USER,
    ]);
    expect(
      Reflect.getOwnMetadata(ROLES_KEY, TestController.prototype.listEntities),
    ).toBeUndefined();
  });

  it('applies an explicit route role override', () => {
    class TestController {
      listEntities(this: void): void {}
    }

    const configs = getRouteConfigs({
      getMany: { roles: [SystemRole.ADMIN] },
    });
    setupAuthorization(TestController, ROUTES, configs, [SystemRole.USER]);

    expect(
      Reflect.getMetadata(ROLES_KEY, TestController.prototype.listEntities),
    ).toEqual([SystemRole.ADMIN]);
  });
});
