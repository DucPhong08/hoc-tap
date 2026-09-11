import { Role } from '@/modules/roles/entities/role.entity';
import { BaseController } from './base.controller';

describe('BaseController', () => {
  it('registers static one routes before dynamic id routes', () => {
    const Controller = BaseController(Role);
    const handlers = Object.getOwnPropertyNames(Controller.prototype);

    expect(handlers.indexOf('updateOneByCondition')).toBeLessThan(
      handlers.indexOf('updateEntityById'),
    );
    expect(handlers.indexOf('deleteOneByCondition')).toBeLessThan(
      handlers.indexOf('deleteEntityById'),
    );
    expect(Controller.name).toBe('RoleBaseController');
  });
});
