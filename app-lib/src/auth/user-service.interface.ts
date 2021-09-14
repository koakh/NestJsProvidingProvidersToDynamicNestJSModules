import { UserRole } from "./enums";

export interface User {
  id: string;
  password: string;
  username: string;
  email: string;
  roles: UserRole[];
}

export interface UserService {
  find: (id: string) => User;
  findUsername: (username: string) => User;
  insert: (user: Omit<User, 'id' | 'roles'>) => Promise<User>;
}