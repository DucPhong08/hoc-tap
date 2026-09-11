import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import * as bcrypt from 'bcrypt';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

describe('UserService', () => {
  let service: UserService;
  let userRepositoryMock: Partial<UserRepository>;

  const mockAuthUser: IAuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    roles: ['admin'],
  };

  beforeEach(() => {
    userRepositoryMock = {
      exists: jest.fn().mockResolvedValue(false),
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ id: 'new-id', ...dto })),
      getById: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', email: 'existing@example.com' }),
      updateById: jest
        .fn()
        .mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
    };

    service = new UserService(userRepositoryMock as UserRepository);
  });

  it('hashes password when creating user', async () => {
    const rawPassword = 'mysecretpassword';
    await service.create(mockAuthUser, {
      email: 'new@example.com',
      password: rawPassword,
    });

    expect(userRepositoryMock.create).toHaveBeenCalled();
    const createdPayload = (userRepositoryMock.create as jest.Mock).mock
      .calls[0][0];
    expect(createdPayload.password).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, createdPayload.password);
    expect(isMatch).toBe(true);
  });

  it('hashes password when updating user by id', async () => {
    const rawPassword = 'updatedpassword';
    await service.updateById(mockAuthUser, 'user-1', {
      password: rawPassword,
    });

    expect(userRepositoryMock.updateById).toHaveBeenCalled();
    const updatedPayload = (userRepositoryMock.updateById as jest.Mock).mock
      .calls[0][1];
    expect(updatedPayload.password).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, updatedPayload.password);
    expect(isMatch).toBe(true);
  });
});
