import { Role } from '@/modules/roles/entities/role.entity';
import { BaseCrudControllerFactory } from './base-crud.controller';

describe('BaseCrudControllerFactory', () => {
  it('registers static one routes before dynamic id routes', () => {
    const Controller = BaseCrudControllerFactory(Role);
    const handlers = Object.getOwnPropertyNames(Controller.prototype);

    expect(handlers.indexOf('updateOneByCondition')).toBeLessThan(
      handlers.indexOf('updateEntityById'),
    );
    expect(handlers.indexOf('deleteOneByCondition')).toBeLessThan(
      handlers.indexOf('deleteEntityById'),
    );
    expect(Controller.name).toBe('RoleCrudController');
  });
});
