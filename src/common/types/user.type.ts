export interface IUser {
  userId: string;
  email: string;
  roles?: string[];
}

export type UserContext = IUser | null;
