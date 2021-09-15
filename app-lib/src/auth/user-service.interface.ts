import { UserRole } from "./enums";

export interface User {
  id: string;
  password: string;
  username: string;
  email: string;
  roles: UserRole[];
}

export interface UserService {
  create: (user: Omit<User, 'id' | 'roles'>) => Promise<User>;
  find: (id: string) => User;
  findByUsername: (username: string) => User;
  findAll: (skip?: number, take?: number) => User[];
  update: (id: string, user: Omit<User, 'id' | 'roles'>) => User;
  delete: (id: string) => void;
}