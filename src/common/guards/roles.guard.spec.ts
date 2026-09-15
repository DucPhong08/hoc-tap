import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '@/common/constants/role.constant';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow public routes', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when no roles are required', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(null); // requiredRoles
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user is missing', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Role.ADMIN]);
    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow when user has roles array getter (Entity instance)', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Role.ADMIN]);
    const context = createMockContext({ roles: [Role.ADMIN] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when user is plain cached object with role string (Redis cache fallback)', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Role.ADMIN]);
    // Plain deserialized object without roles getter
    const context = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user does not have required role', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Role.ADMIN]);
    const context = createMockContext({ role: Role.USER });
    expect(guard.canActivate(context)).toBe(false);
  });
});
