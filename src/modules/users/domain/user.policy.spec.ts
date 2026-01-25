import { UserPolicy } from './user.policy';
import { User, UserRecord } from './user.model';

describe('UserPolicy', () => {
  describe('canUpdateEmail', () => {
    it('should allow email update after 7 days', () => {
      const record = new UserRecord('John', 'Doe', 'john@example.com');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      const user = new User('123', record, new Date(), oldDate);
      expect(UserPolicy.canUpdateEmail(user, 'newemail@example.com')).toBe(true);
    });

    it('should not allow email update before 7 days', () => {
      const record = new UserRecord('John', 'Doe', 'john@example.com');
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 6);
      const user = new User('123', record, new Date(), recentDate);
      expect(UserPolicy.canUpdateEmail(user, 'newemail@example.com')).toBe(false);
    });
  });

  describe('isEmailUnique', () => {
    it('should return true for unique email', () => {
      const existingEmails = ['test1@example.com', 'test2@example.com'];
      expect(UserPolicy.isEmailUnique('new@example.com', existingEmails)).toBe(true);
    });

    it('should return false for duplicate email', () => {
      const existingEmails = ['test1@example.com', 'test2@example.com'];
      expect(UserPolicy.isEmailUnique('test1@example.com', existingEmails)).toBe(false);
    });

    it('should be case insensitive', () => {
      const existingEmails = ['test1@example.com'];
      expect(UserPolicy.isEmailUnique('TEST1@EXAMPLE.COM', existingEmails)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = UserPolicy.validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = UserPolicy.validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase letter', () => {
      const result = UserPolicy.validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = UserPolicy.validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = UserPolicy.validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});
