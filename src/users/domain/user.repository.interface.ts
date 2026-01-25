import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { User } from './user.model';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}
