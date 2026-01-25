import { User } from './user.model';

export class UserPolicy {
  static canUpdateEmail(user: User, newEmail: string): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return user.updatedAt < oneWeekAgo;
  }

  static isEmailUnique(email: string, existingEmails: string[]): boolean {
    return !existingEmails.includes(email.toLowerCase());
  }

  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return { valid: errors.length === 0, errors };
  }
}
