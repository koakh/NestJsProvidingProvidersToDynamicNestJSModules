import { Injectable } from '@nestjs/common';
import { User, UserService as UserServiceInterface } from 'app-lib';
import { InMemoryUserStore } from './user.data';

@Injectable()
export class UserService implements UserServiceInterface {
  private users: InMemoryUserStore = new InMemoryUserStore();

  find(id: string): User {
    return this.users.find((e: User) => id === e.id);
  };

  insert(user: Exclude<User, 'id'>): User {
    return this.users.create(user);
  }
}
