import { ConflictException, NotFoundException } from "@nestjs/common";
import { hashPassword, User, UserRole } from 'app-lib';
import { v4 as uuidv4 } from 'uuid';

export class UserStore {
  private data: User[];

  constructor() {
    this.data = new Array<User>();
    User.forEach((e: User) => {
      this.data.push(e);
    })
  }

  async create(user: Omit<User, 'id' | 'roles'>): Promise<User> {
    const existing = this.find((e: User) => user.username === e.username || user.email === e.email);
    // Logger.log(`existing: ${JSON.stringify(existing)}`, InMemoryUserStore.name);
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const newUser: User = {
      ...user,
      id: uuidv4(),
      password: await hashPassword(user.password),
      roles: [UserRole.RoleUser]
    };
    this.data.push(newUser);
    // return created data as double check
    const checkUser = this.find((e: User) => newUser.id === e.id, false);
    return { ...checkUser, password: undefined };
  }

  update(id: string, updateData: Omit<User, 'id' | 'username' | 'roles'>): User {
    this.data.forEach((user: User) => {
      if (user.id === id) {
        const keys = Object.keys(updateData);
        keys.forEach(async (key) => {
          if (key != 'id' && key != 'password') {
            user[key] = updateData[key];
          }
          if (key === 'password') {
            user[key] = await hashPassword(updateData[key]);
          }
        });
      };
    });
    // return updated user
    return this.find((e: User) => id === e.id);
  };

  getPaginated(limit: number, offset: number): User[] {
    const result: User[] = []
    for (let i = 0; i <= this.data.length - 1; i++) {
      if (i >= offset) {
        result.push({ ...this.data[i], password: undefined });
      }
      if (limit && result.length === limit) {
        break;
      }
    }
    return result;
  }

  find(predicateFn: { (e: User): boolean }, omitPassword: boolean = true): User {
    const user = this.data.find((e: User) => predicateFn(e));
    if (user && omitPassword) {
      delete user.password;
    }
    return user
  }

  delete(id: string): { id: string } {
    const existing = this.find((e: User) => id === e.id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    // prepare clone and remove
    const clone = this.data.slice();
    this.data = clone.filter((e: User) => e.id != id);
    return { id };
  }

  findAll(skip: number, take: number): User[] {
    return this.getPaginated(take, skip);
  }
}

// https://www.mockaroo.com/
// https://bcrypt-generator.com/
const User: User[] = [{
  id: '520c2eb5-e83b-4ef5-a343-85756bcce149',
  username: 'johndoe',
  // 12345678
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'ktrett1@livejournal.com',
  roles: [UserRole.RoleAdmin, UserRole.RoleUser],
}, {
  id: 'fa525f32-b6b7-40b5-8d09-b638d00ded3b',
  username: 'sstert2',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'sstert2@ask.com',
  roles: [UserRole.RoleUser],
}, {
  id: '136c8e64-b5b2-4606-b845-f9dc26f3fb28',
  username: 'gnatte3',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'gnatte3@i2i.jp',
  roles: [UserRole.RoleUser],
}, {
  id: '0da9413f-ba84-4b9c-9729-37daa78de2d9',
  username: 'zespinheira4',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'zespinheira4@bandcamp.com',
  roles: [UserRole.RoleUser],
}, {
  id: 'dffbd368-8ea1-484c-96e7-2aaf2595a14d',
  username: 'ejessope5',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'ejessope5@plala.or.jp',
  roles: [UserRole.RoleUser],
}, {
  id: 'b68d77c6-2e0c-4d8b-991a-ab3154616625',
  username: 'wmewrcik6',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'wmewrcik6@elegantthemes.com',
  roles: [UserRole.RoleUser],
}, {
  id: 'e25f2e23-fb96-4e36-8d7a-527a04a6f21a',
  username: 'bpersey7',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'bpersey7@paypal.com',
  roles: [UserRole.RoleUser],
}, {
  id: '15566d70-2cc6-4d01-a005-1783e3333153',
  username: 'kbertholin8',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'kbertholin8@cbc.ca',
  roles: [UserRole.RoleUser],
}, {
  id: 'd9c0ec8c-3f30-45dc-9c9e-0535855eebb7',
  username: 'aslater9',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'aslater9@altervista.org',
  roles: [UserRole.RoleUser],
}, {
  id: '2ad49b88-822b-4764-ae58-54fd4f487faf',
  username: 'olarkinsa',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'olarkinsa@prlog.org',
  roles: [UserRole.RoleUser],
}, {
  id: 'b4b9df50-a68d-4754-8006-fdac47bd6ff4',
  username: 'ldixieb',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'ldixieb@eventbrite.com',
  roles: [UserRole.RoleUser],
}, {
  id: 'f6970851-795c-4f8c-85b1-3734faebc13b',
  username: 'aludvigsenc',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'aludvigsenc@cyberchimps.com',
  roles: [UserRole.RoleUser],
}, {
  id: 'c6d10ac0-5529-41c1-865e-e01713cee884',
  username: 'probardd',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'probardd@devhub.com',
  roles: [UserRole.RoleUser],
}, {
  id: '5ea39b45-0efc-4754-8bcc-6094f5ed412f',
  username: 'cspreadburye',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'cspreadburye@xinhuanet.com',
  roles: [UserRole.RoleUser],
}, {
  id: 'f81c4c20-246a-4519-9b7c-6c685ceb66df',
  username: 'vheavensf',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'vheavensf@nbcnews.com',
  roles: [UserRole.RoleUser],
}, {
  id: '7f2ed332-a7ca-4c23-84e6-d341e761c73c',
  username: 'roquing',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'roquing@uiuc.edu',
  roles: [UserRole.RoleUser],
}, {
  id: '3d016ad5-a407-44ea-8eb4-f034fd1c3930',
  username: 'lculloteyh',
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'lculloteyh@jimdo.com',
  roles: [UserRole.RoleUser],
}];