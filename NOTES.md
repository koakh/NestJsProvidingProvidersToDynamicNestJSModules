# NOTES

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
# clean up files
$ rm app-lib/src/app.*
$ rm app-lib/src/main.ts

# create AuthModule
$ nest g mo app-lib/src/Auth
# create AuthService
$ nest g s app-lib/src/Auth
```

## AppLib : Dynamic Module Library : Follow  Jay McDoniel awesome Post

- [Providing Providers to Dynamic NestJS Modules](https://dev.to/nestjs/providing-providers-to-dynamic-nestjs-modules-1i6n)
- [nestjs/packages/modules at master · golevelup/nestjs](https://github.com/golevelup/nestjs/tree/master/packages/modules)

### Dependencies

```shell
# install dependencies
$ cd app-lib
$ npm i @golevelup/nestjs-modules jsonwebtoken
```

### Change Package

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

### AuthConstants

```shell
# create auth.constants.ts
$ code src/auth/auth.constants.ts
```

`app-lib/src/auth/auth.constants.ts`

```typescript
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

### UserService

```shell
# create user-service.interface.ts
$ code src/auth/user-service.interface.ts
```

`app-lib/src/auth/user-service.interface.ts`

```typescript
export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
}

export interface UserService {
  find: (id: string) => User;
  insert: (user: Exclude<User, 'id'>) => User;
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

@Module({
  providers: [AuthService],
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
}) {}
```

### AuthService

```shell
# create auth.service.ts
$ code src/auth/auth.service.ts
```

`app-lib/src/auth/auth.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';

import { AUTH_SECRET, USER_SERVICE } from './auth.constants';
import { UserService } from './user-service.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SECRET) private readonly secret: string,
    @Inject(USER_SERVICE) private readonly userService: UserService,
  ) {}

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

### build Package

```shell
$ npm run build
```

or use `start:dev` to use development script to watch and build

```shell
$ npm run start:dev
```

## Consumer App

leaving `npm run start:dev` in one window, open another terminal window

```shell
# enter path
$ cd app
```

### Dependencies

```shell
# install local app-lib library
$ npm i ../app-lib/
# install third party
$ npm i @nestjs/config
```

### .env file

```shell
$ code .env
```

`app/.env`

```conf
AUTH_SECRET_VALUE=supersecretpassword
```

### Generate UserModule and UserService

```shell
# generate UserModule
$ nest g mo User
# generate UserService
$ nest g s User
# generate UserController
$ nest g co User
```

### InMemoryUserStore

> all users password is `12345678`

`app/src/user/user.data.ts`

```typescript
import { NotFoundException } from "@nestjs/common";
import { User } from 'app-lib';

export class InMemoryUserStore {
  private data: User[];
  constructor() {
    this.data = new Array<User>();
    User.forEach((e: User) => {
      this.data.push(e);
    })
  }

  create(user: User): User {
    this.data.push(user);
    // return created data as double check
    return this.find((e: User) => user.id === e.id);
  }

  update(id: string, updateData: User) {
    this.data.forEach((user: User) => {
      if (user.id === id) {
        const keys = Object.keys(updateData);
        keys.forEach(key => {
          if (key != 'id') {
            user[key] = updateData[key];
          }
        });
      };
    });
  };

  getPaginated(limit: number, offset: number): User[] {
    const result: User[] = []
    for (let i = 0; i <= this.data.length - 1; i++) {
      if (i >= offset) {
        result.push(this.data[i]);
      }
      if (limit && result.length === limit) {
        break;
      }
    }
    return result;
  }

  find(predicateFn: { (e: User): boolean }): User {
    return this.data.find((e: User) => predicateFn(e));
  }

  delete(id: string): { id: string } {
    if (this.data.length === 0) {
      throw new NotFoundException();
    }
    // prepare clone and remove
    const clone = this.data.slice();
    this.data = clone.filter((e: User) => e.id != id);
    return { id };
  }

  findAll(skip: number, take: number): User[] {
    return this.getPaginated(take, skip);
  }

  filter(predicateFn: { (e: User): boolean }, skip?: number, take?: number): User[] {
    return (skip > 0 && take > 0)
      ? this.data.splice(skip, take)
      : this.data;
  }
}

const User: User[] = [{
  ...c.adminUser,
}, {
  id: '520c2eb5-e83b-4ef5-a343-85756bcce149',
  username: 'johndoe',
  // 12345678
  password: '$2b$10$U9AVUdkRnFsrMjPg/XyTeOWmF.gu73gd1hJGR1s1OnKTshjJYdGpW',
  email: 'ktrett1@livejournal.com',
}, {
  id: 'fa525f32-b6b7-40b5-8d09-b638d00ded3b',
  username: 'sstert2',
  password: 'QFYrO4E1jC',
  email: 'sstert2@ask.com',
}, {
  id: '136c8e64-b5b2-4606-b845-f9dc26f3fb28',
  username: 'gnatte3',
  password: 'mjjZNjHv3H',
  email: 'gnatte3@i2i.jp',
}, {
  id: '0da9413f-ba84-4b9c-9729-37daa78de2d9',
  username: 'zespinheira4',
  password: '5dorGXixK7',
  email: 'zespinheira4@bandcamp.com',
}, {
  id: 'dffbd368-8ea1-484c-96e7-2aaf2595a14d',
  username: 'ejessope5',
  password: 'fjzgiOPlT4sZ',
  email: 'ejessope5@plala.or.jp',
}, {
  id: 'b68d77c6-2e0c-4d8b-991a-ab3154616625',
  username: 'wmewrcik6',
  password: 'UCAZ4rst',
  email: 'wmewrcik6@elegantthemes.com',
}, {
  id: 'e25f2e23-fb96-4e36-8d7a-527a04a6f21a',
  username: 'bpersey7',
  password: '5j370ubKlJ4l',
  email: 'bpersey7@paypal.com',
}, {
  id: '15566d70-2cc6-4d01-a005-1783e3333153',
  username: 'kbertholin8',
  password: '4UUgZBMWuj',
  email: 'kbertholin8@cbc.ca',
}, {
  id: 'd9c0ec8c-3f30-45dc-9c9e-0535855eebb7',
  username: 'aslater9',
  password: 'GWqYPW7',
  email: 'aslater9@altervista.org',
}, {
  id: '2ad49b88-822b-4764-ae58-54fd4f487faf',
  username: 'olarkinsa',
  password: 'crQymDaIax',
  email: 'olarkinsa@prlog.org',
}, {
  id: 'b4b9df50-a68d-4754-8006-fdac47bd6ff4',
  username: 'ldixieb',
  password: 'ufm8uSNpQym',
  email: 'ldixieb@eventbrite.com',
}, {
  id: 'f6970851-795c-4f8c-85b1-3734faebc13b',
  username: 'aludvigsenc',
  password: 'Ba9SjsV',
  email: 'aludvigsenc@cyberchimps.com',
}, {
  id: 'c6d10ac0-5529-41c1-865e-e01713cee884',
  username: 'probardd',
  password: 'o982PUSpRS',
  email: 'probardd@devhub.com',
}, {
  id: '5ea39b45-0efc-4754-8bcc-6094f5ed412f',
  username: 'cspreadburye',
  password: 'HlAkSFev3',
  email: 'cspreadburye@xinhuanet.com',
}, {
  id: 'f81c4c20-246a-4519-9b7c-6c685ceb66df',
  username: 'vheavensf',
  password: 'fX4OX9t',
  email: 'vheavensf@nbcnews.com',
}, {
  id: '7f2ed332-a7ca-4c23-84e6-d341e761c73c',
  username: 'roquing',
  password: 'g7TUBIr',
  email: 'roquing@uiuc.edu',
}, {
  id: '3d016ad5-a407-44ea-8eb4-f034fd1c3930',
  username: 'lculloteyh',
  password: 'HQwX26n9D',
  email: 'lculloteyh@jimdo.com',
}];
```

### AppModule

```shell
$ code src/app.module.ts
```

`app/src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from 'app-lib';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
@Module({
  imports: [
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
```








publish package





## Fix Errors in Post

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
