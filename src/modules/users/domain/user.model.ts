export class UserRecord {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }
}

export class User {
  constructor(
    readonly id: string,
    readonly record: UserRecord,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  canBeDeleted(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt < thirtyDaysAgo;
  }
}
