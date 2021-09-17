# NOTES

- [NOTES](#notes)
  - [Create Project Structure](#create-project-structure)
  - [Clean up and Scaffold project Paths](#clean-up-and-scaffold-project-paths)
  - [AppLib : Library](#applib--library)
    - [AppLib Dependencies](#applib-dependencies)
    - [Change Package.json](#change-packagejson)
    - [Change Scripts](#change-scripts)
    - [AppLib : Final Created Files](#applib--final-created-files)
    - [Main `app-lib` Library Export Barrel File](#main-app-lib-library-export-barrel-file)
    - [UserService Interface](#userservice-interface)
    - [AuthConstants](#authconstants)
    - [AuthInterface | AuthModuleOptions](#authinterface--authmoduleoptions)
    - [AuthService](#authservice)
    - [AuthController](#authcontroller)
    - [AuthModule](#authmodule)
    - [AppLib DTO's](#applib-dtos)
    - [Enum's](#enums)
    - [Util's](#utils)
    - [build Package](#build-package)
  - [App : Consumer App](#app--consumer-app)
    - [Consumer App Dependencies](#consumer-app-dependencies)
    - [App : Final Created Files](#app--final-created-files)
    - [Generate UserModule and UserService](#generate-usermodule-and-userservice)
    - [.env file](#env-file)
    - [AppModule](#appmodule)
    - [UserService](#userservice)
    - [UserController](#usercontroller)
    - [UserStore | InMemoryUserStore](#userstore--inmemoryuserstore)
    - [UserModule](#usermodule)
    - [App DTO's](#app-dtos)
    - [Run Consumer App](#run-consumer-app)
    - [Run some test Request's](#run-some-test-requests)
    - [Debug Consumer App and AppLib](#debug-consumer-app-and-applib)
  - [Publish Package](#publish-package)
  - [Fix Errors in Post](#fix-errors-in-post)
    - [Export interface User](#export-interface-user)
  - [How to import a registerAsync in a dynamic Nestjs module](#how-to-import-a-registerasync-in-a-dynamic-nestjs-module)

## Create Project Structure

```shell
# create consumer app project
$ nest new app

# create library project
$ nest new app-lib

# remove git folders
$ app/.git -R
$ app-lib/.git -R

# init git on project root
$ git init
$ git add .
$ git commit -am "first commit"
```

## Clean up and Scaffold project Paths

```shell
# clean up not used files/dirs
$ rm app-lib/src -R
$ rm app-lib/test -R

# create AuthModule
$ nest g mo app-lib/src/Auth
# create AuthService
$ nest g s app-lib/src/Auth
# create AuthController
$ nest g co app-lib/src/Auth
```

## AppLib : Library

### AppLib Dependencies

```shell
# install dependencies
$ cd app-lib
$ npm i @golevelup/nestjs-modules jsonwebtoken bcrypt
```

### Change Package.json

this is require for library to work

```shell
$ code package.json
```

`app-lib/package.json`

```shell
  "files": [
    "dist/**/*",
    "*.md"
  ],
```

### Change Scripts

replace scripts `app-lib/package.json` with

```shell
$ code package.json
```

```json
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start:dev": "nest build --watch",
    "start:debug": "nest build --debug --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
```

> this way we can use `npm run start:dev` to build and watch for changes

### AppLib : Final Created Files

```shell
src
├── auth
│   ├── auth.constants.ts
│   ├── auth.controller.spec.ts (not used)
│   ├── auth.controller.ts
│   ├── auth.interface.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto
│   │   ├── index.ts
│   │   └── signin.dto.ts
│   ├── enums
│   │   ├── index.ts
│   │   └── user-role.enum.ts
│   ├── user-service.interface.ts
│   └── util
│       ├── authentication.ts
│       └── index.ts
└── index.ts
```

### Main `app-lib` Library Export Barrel File

add export library files to barrel file, this will expose library exports

`app-lib/src/index.ts`

```shell
$ code src/index.ts
```

```typescript
export * from './auth/auth.constants';
export * from './auth/auth.controller';
export * from './auth/auth.interface';
export * from './auth/auth.module';
export * from './auth/auth.service';
export * from './auth/enums';
export * from './auth/user-service.interface';
export * from './auth/util';
```

> Note: some files will be created in future, or live in repository

### UserService Interface

```shell
# create user-service.interface.ts
$ code src/auth/user-service.interface.ts
```

`app-lib/src/auth/user-service.interface.ts`

```typescript
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
```

### AuthConstants

```shell
# create auth.constants.ts
$ code src/auth/auth.constants.ts
```

`app-lib/src/auth/auth.constants.ts`

```typescript
// injection token's
export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');
export const AUTH_SECRET = Symbol('AUTH_SECRET');
export const USER_SERVICE = Symbol('USER_SERVICE');
```

### AuthInterface | AuthModuleOptions

```shell
# create auth.interface.ts
$ code src/auth/auth.interface.ts
```

`app-lib/src/auth/auth.interface.ts`

```typescript
import { UserService } from './user-service.interface';

export interface AuthModuleOptions {
  secret: string;
  userService: UserService;
}
```

### AuthService

```shell
# create auth.service.ts
$ code src/auth/auth.service.ts
```

`app-lib/src/auth/auth.service.ts`

```typescript
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { AUTH_SECRET, USER_SERVICE } from './auth.constants';
import { UserService } from './user-service.interface';
import { comparePassword, createJWT } from './util/authentication';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SECRET) private readonly secret: string,
    @Inject(USER_SERVICE) private readonly userService: UserService,
  ) { }

  async signIn(username: string, password: string): Promise<string> {
    const existing = this.userService.findByUsername(username);
    if (!existing) {
      throw new UnauthorizedException();
    }
    const valid = await comparePassword(password, existing.password);
    if (!valid) {
      throw new UnauthorizedException();
    }
    return createJWT(this.secret, { sub: existing.id, roles: existing.roles });
  }

  findUser(id: string) {
    return this.userService.find(id);
  }

  signToken(payload: Record<string, any>) {
    return sign(payload, this.secret);
  }

  verifyToken(token: string) {
    return verify(token, this.secret);
  }
}
```

### AuthController

```shell
# create auth.controller.ts
$ code src/auth/auth.controller.ts
```

`app-lib/src/auth/auth.controller.ts`

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('signin')
  async signIn(@Body() { username, password }: SignInDto): Promise<{ accessToken: string }> {
    return { accessToken: await this.authService.signIn(username, password) };
  }
}
```

### AuthModule

```shell
# create auth.module.ts
$ code src/auth/auth.module.ts
```

`app-lib/src/auth/auth.module.ts`

```typescript
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { Module } from '@nestjs/common';

import { AUTH_OPTIONS, AUTH_SECRET, USER_SERVICE } from './auth.constants';
import { AuthModuleOptions } from './auth.interface';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule extends createConfigurableDynamicRootModule<AuthModule, AuthModuleOptions>(AUTH_OPTIONS, {
  providers: [
    {
      provide: AUTH_SECRET,
      inject: [AUTH_OPTIONS],
      useFactory: (options: AuthModuleOptions) => options.secret,
    },
    {
      provide: USER_SERVICE,
      inject: [AUTH_OPTIONS],
      useFactory: (options: AuthModuleOptions) => options.userService,
    },
  ],
  controllers: [
    AuthController
  ]
}) { }
```

### AppLib DTO's

```shell
# create signin.dto.ts
$ code src/auth/dto/signin.dto.ts
```

`app-lib/src/auth/signin.dto.ts`

```typescript
export class SignInDto {
  username: string;
  password: string;
}
```

```shell
# create index.ts
$ code src/auth/dto/index.ts
```

`app-lib/src/auth/index.ts`

```typescript
export * from './signin.dto';
```

### Enum's

```shell
# create user-role.enum.ts
$ code src/auth/enums/user-role.enum.ts
```

`app-lib/src/auth/enums/user-role.enum.ts`

```typescript
export enum UserRole {
  RoleAdmin = 'ROLE_ADMIN',
  RoleUser = 'ROLE_USER',
}
```

```shell
# create index.ts
$ code src/auth/enums/index.ts
```

`app-lib/src/auth/enums/index.ts`

```typescript
export * from './user-role.enum';
```

### Util's

```shell
# create authentication.ts
$ code src/auth/util/authentication.ts
```

`app-lib/src/auth/util/authentication.ts`

```typescript
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../enums/user-role.enum';

const saltRounds = 10;

export function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainText, hash, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

export function hashPassword(plainText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plainText, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      }
      resolve(hash);
    });
  });
}

export function createJWT(secret: string, data: { sub: string, roles: UserRole[] }): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(data, secret, (err, token) => {
      if (err) {
        return reject(err);
      }
      return resolve(token as string);
    });
  });
}

export function decodeJWT(secret: string, token: string): Promise<{ sub: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      }
      const { sub } = decoded as { sub: string };
      resolve({ sub });
    });
  });
}
```

```shell
# create index.ts
$ code src/auth/util/index.ts
```

`app-lib/src/auth/util/index.ts`

```typescript
export * from './authentication';
```

### build Package

done we have library ready, now we must build and use it in a **consumer app** (app)

```shell
$ npm run build
```

> Tip: use `npm run start:dev` to use development script to watch and build, useful to work iwith consumer app

```shell
$ npm run start:dev
```

## App : Consumer App

> TIP: if launch `npm run start:dev` in above steps, leave it running and open another terminal window, this will keep build `app-lib` in background for us if we change it

```shell
# enter path
$ cd app
```

### Consumer App Dependencies

```shell
# install local app-lib library
$ npm i ../app-lib/
# install third party
$ npm i @nestjs/config uuid
```

### App : Final Created Files

```shell
.env
src/
├── app.controller.spec.ts (not used)
├── app.module.ts
├── main.ts
└── user
    ├── dto
    │   ├── create-user.dto.ts
    │   ├── index.ts
    │   └── update-user.dto.ts
    ├── user.controller.spec.ts (not used)
    ├── user.controller.ts
    ├── user.module.ts
    ├── user.service.spec.ts (not used)
    ├── user.service.ts
    └── user.store.ts
```

### Generate UserModule and UserService

```shell
# generate UserModule
$ nest g mo User
# generate UserService
$ nest g s User
# generate UserController
$ nest g co User

# remove AppService
$ rm app/src/app.service.ts
# remove AppController
$ rm app/src/app.controller.ts
```

### .env file

```shell
$ code .env
```

`app/.env`

```conf
AUTH_SECRET_VALUE="supersecretpassword"
```

### AppModule

```shell
$ code src/app.module.ts
```

`app/src/app.module.ts

```typescript
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from 'app-lib';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule.forRootAsync(AuthModule, {
      imports: [ConfigModule, UserModule],
      inject: [ConfigService, UserService],
      useFactory: (config: ConfigService, userService: UserService) => {
        return {
          secret: config.get('AUTH_SECRET_VALUE'),
          userService,
        };
      },
    }),
    UserModule,
  ],
  controllers: [UserController],
  providers: [],
})
export class AppModule { }
```

### UserService

```shell
$ code src/user/user.service.ts
```

`app/src/user/user.service.ts`

```typescript
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
```

### UserController

```shell
$ code src/user/user.controller.ts
```

`app/src/user/user.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { User } from 'app-lib';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) { }

  @Post()
  create(@Body() user: CreateUserDto): Promise<User> {
    return this.userService.create(user);
  }

  @Get(':id')
  find(@Param('id') id: string): User {
    return this.userService.find(id);
  }

  @Get()
  findAll(@Body() options: { skip?: number, take?: number }): User[] {
    return this.userService.findAll(options.skip || 0, options.take || 6);
  }

  @Put(':id')
  put(@Param('id') id: string, @Body() user: UpdateUserDto): User {
    return this.userService.update(id, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string): void {
    return this.userService.delete(id);
  }
}
```

### UserStore | InMemoryUserStore

> all users password is `12345678`

```shell
$ code src/user/user.store.ts
```

`app/src/user/user.store.ts`

```typescript
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
```

### UserModule

```shell
$ code src/user/user.module.ts
```

`app/src/user/user.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController]
})
export class UserModule {}
```

### App DTO's

```shell
$ code src/user/dto/create-user.dto.ts 
```

`app/src/user/dto/create-user.dto.ts`

```typescript
import { UpdateUserDto } from "./update-user.dto";

export class CreateUserDto extends UpdateUserDto {
  username: string;
}
```

```shell
$ code src/user/dto/update-user.dto.ts 
```

`app/src/user/dto/update-user.dto.ts`

```typescript
export class UpdateUserDto {
  password: string;
  email: string;
}
```

```shell
$ code src/user/dto/index.ts 
```

`app/src/user/dto/index.ts`

```typescript
export * from './create-user.dto';
export * from './update-user.dto';
```

### Run Consumer App

> use npm scripts

- start
- start:dev
- start:debug
- start:prod

```shell
# enter path
$ cd app
# run in wathc mode
$ npm run start:dev
```

### Run some test Request's

> Tip: install REST Client for Visual Studio Code extension `humao.rest-client` and use clint.http to launch requests
> Tip: install `jq` or remove `| jq` from commands

or use bellow curls

```shell
# createUser
$ curl --request POST \
  --url http://localhost:3000/user \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"username": "koakh","email": "koakh@example.com","password": "12345678"}' \
  jq

{
  "username": "koakh",
  "email": "koakh@example.com",
  "id": "a1bf41dc-d3d2-4844-ad23-a6a828326083",
  "roles": [
    "ROLE_USER"
  ]
}

# updateUser
$ curl --request PUT \
  --url http://localhost:3000/user/520c2eb5-e83b-4ef5-a343-85756bcce149 \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"email": "john@example.com","password": "87654321"}' \
  | jq

{
  "id": "520c2eb5-e83b-4ef5-a343-85756bcce149",
  "username": "johndoe",
  "email": "john@example.com",
  "roles": [
    "ROLE_ADMIN",
    "ROLE_USER"
  ]
}

# findUser
$ curl --request GET \
  --url http://localhost:3000/user/520c2eb5-e83b-4ef5-a343-85756bcce149 \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{}' \
  | jq

{
  "id": "520c2eb5-e83b-4ef5-a343-85756bcce149",
  "username": "johndoe",
  "email": "john@example.com",
  "roles": [
    "ROLE_ADMIN",
    "ROLE_USER"
  ]
}

# findAllUsers
$ curl --request GET \
  --url http://localhost:3000/user \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"skip": 0,"take": 5}' |
  jq

[
  {
    "id": "520c2eb5-e83b-4ef5-a343-85756bcce149",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": [
      "ROLE_ADMIN",
      "ROLE_USER"
    ]
  },
  .....

# deleteUser
$ curl --request DELETE \
  --url http://localhost:3000/user/520c2eb5-e83b-4ef5-a343-85756bcce149 \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{}' \
  | jq

# loginUser
$ curl --request POST \
  --url http://localhost:3000/auth/signin \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"username": "johndoe","password": "87654321"}'

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjBjMmViNS1lODNiLTRlZjUtYTM0My04NTc1NmJjY2UxNDkiLCJyb2xlcyI6WyJST0xFX0FETUlOIiwiUk9MRV9VU0VSIl0sImlhdCI6MTYzMTcwNTU2M30.Gn6GNuPbA4UcVQn9zJGR6RhpT-9nVhc2LTM4VIO5a_c"
}
```

done we have test consumer `app` connected to `app-lib`, and everything should work has expected

### Debug Consumer App and AppLib

to have a better DX in app/app-lib development is better to work with both projects at same time and with vscode debugger, for this the repo already has a vscode launch configuration created at`.vscode/launch.json`

first run app-lib in watch mode and leave it in background

```shell
# enter path
$ cd app
# run in wathc mode
$ npm run start:dev
```

now create a breakpoint in `app-lib` for ex in file `app-lib/src/auth/auth.service.ts` in line `const existing = this.userService.findByUsername(username);`

next create a breakpoint in `app` for ex in file `app/src/user/user.store.ts` in line `const existing = this.find((e: User) => user.username === e.username || user.email === e.email);`

> TIP: you can use `debugger;` to create breakpoints in code to, some times is a better choise

now launch debugger configuration `Launch via NPM` or just press `F5` shortcut key

```shell
# test app-lib breakpoint with
$ curl --request POST \
  --url http://localhost:3000/auth/signin \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"username": "johndoe","password": "12345678"}' |
  jq


# test app breakpoint with
$ curl --request POST \
  --url http://localhost:3000/user \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"username": "koakh","email": "koakh@example.com","password": "12345678"}' |
  jq
```

done, it should break on both breakpoints

## Publish Package

TLDR: it's to easy to publish the `app-lib` package on private or public npm registry, for this one must update `app/package.json` and use npm publish after it

## Fix Errors in Post

### Export interface User

src/auth/auth.service.ts:14:3 - error TS4053: Return type of public method from exported class has or is using name 'User' from external module "/media/mario/storage/Home/Documents/Development/Node/@NestJsDynamicModulesProjects/NestJsProvidingProvidersToDynamicNestJSModules/app-lib/src/auth/user-service.interface" but cannot be named.

`app-lib/src/auth/user-service.interface.ts`

add export to User interafce

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

## How to import a registerAsync in a dynamic Nestjs module

> Note: this section are duplicated in both files

sometimes we need to **import a registerAsync in a dynamic Nestjs module** like the image bellow, after fight 2 hours trying to do it, the trick is a combination of using `@Global()`, `exports: [AUTH_OPTIONS]`, and `inject: [AUTH_OPTIONS]`

![image](assets/2021-09-17-16-58-32.png)

```typescript
// NOTE TRICK : import a registerAsync : use @Global()
@Global()
@Module({
  // NOTE import a registerAsync : export AUTH_OPTIONS
  exports: [AuthService, LdapService, CONFIG_SERVICE],
  controllers: [AuthController, LdapController],
})
export class AuthModule extends createConfigurableDynamicRootModule<AuthModule, ModuleOptions>(AUTH_OPTIONS, {
  imports: [
    JwtModule.registerAsync({
      // NOTE TRICK : import a registerAsync : inject AUTH_OPTIONS
      inject: [CONFIG_SERVICE],
      useFactory: async (
        config: ModuleOptionsConfig,
      ) => ({
        secret: config.jwt.accessTokenJwtSecret,
        signOptions: { expiresIn: config.jwt.accessTokenExpiresIn },
      }),
    }),
  ],
  // dynamic module injected custom providers
  providers: [
    AuthService, JwtStrategy, LdapStrategy, RolesStrategy, LdapService,
    // register a global-scoped filter directly from any module
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      inject: [AUTH_OPTIONS],
      provide: CONSUMER_APP_SERVICE,
      useFactory: (options: ModuleOptions) => options.consumerAppService,
    },
    {
      inject: [AUTH_OPTIONS],
      provide: CONFIG_SERVICE,
      useFactory: (options: ModuleOptions) => options.config,
    },
  ],
}) {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieParserMiddleware).forRoutes('/auth/refresh-token');
  }
}
```

> Note: cutted code version with essencials only
