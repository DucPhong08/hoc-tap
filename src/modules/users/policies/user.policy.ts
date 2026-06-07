import { User } from '../entities/user.entity';

export class UserPolicy {
  static canUpdateEmail(user: User): boolean {
    if (!user.updatedAt) return true;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return user.updatedAt < oneWeekAgo;
  }

  static canDelete(user: User): boolean {
    if (!user.createdAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return user.createdAt < thirtyDaysAgo;
  }
}
