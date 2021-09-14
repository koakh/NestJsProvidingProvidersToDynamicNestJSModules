export interface User {
  id?: string;
  password: string;
  username: string;
  email: string;
}

export interface UserService {
  find: (id: string) => User;
  insert: (user: Exclude<User, 'id'>) => User;
}