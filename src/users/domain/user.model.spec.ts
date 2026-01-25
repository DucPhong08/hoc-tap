import { User, UserRecord } from './user.model';

describe('UserRecord', () => {
  it('should create a user record', () => {
    const record = new UserRecord('John', 'Doe', 'john@example.com');
    expect(record.firstName).toBe('John');
    expect(record.lastName).toBe('Doe');
    expect(record.email).toBe('john@example.com');
  });

  it('should return full name', () => {
    const record = new UserRecord('John', 'Doe', 'john@example.com');
    expect(record.fullName).toBe('John Doe');
  });

  it('should validate email correctly', () => {
    const validRecord = new UserRecord('John', 'Doe', 'john@example.com');
    expect(validRecord.isValidEmail()).toBe(true);

    const invalidRecord = new UserRecord('John', 'Doe', 'invalid-email');
    expect(invalidRecord.isValidEmail()).toBe(false);
  });
});

describe('User', () => {
  it('should create a user', () => {
    const record = new UserRecord('John', 'Doe', 'john@example.com');
    const user = new User('123', record, new Date(), new Date());
    expect(user.id).toBe('123');
    expect(user.record).toBe(record);
  });

  it('should allow deletion after 30 days', () => {
    const record = new UserRecord('John', 'Doe', 'john@example.com');
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    const user = new User('123', record, oldDate, new Date());
    expect(user.canBeDeleted()).toBe(true);
  });

  it('should not allow deletion before 30 days', () => {
    const record = new UserRecord('John', 'Doe', 'john@example.com');
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 29);
    const user = new User('123', record, recentDate, new Date());
    expect(user.canBeDeleted()).toBe(false);
  });
});
