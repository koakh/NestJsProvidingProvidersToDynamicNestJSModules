import { Injectable } from '@nestjs/common';
import { User, UserService as UserServiceInterface } from 'app-lib';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserStore } from './user.store';

@Injectable()
export class UserService implements UserServiceInterface {
  private users: UserStore = new UserStore();

  async create(user: CreateUserDto): Promise<User> {
    return await this.users.create(user);
  }

  find(id: string): User {
    return this.users.find((e: User) => id === e.id);
  };

  findByUsername(username: string): User {
    return this.users.find((e: User) => username === e.username, false);
  };

  findAll(skip?: number, take?: number): User[] {
    return this.users.findAll(skip, take);
  };

  update(id: string, user: UpdateUserDto): User {
    return this.users.update(id, user);
  }  

  delete(id: string): void {
    this.users.delete(id);
  };
}
