import { Authorize } from './authorize.decorator';

export const Authorization = (...roles: string[]) => Authorize(...roles);
