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
  name: string;
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

import { AUTH_OPTIONS } from './auth.constants';
import { AuthModuleOptions } from './auth.interface';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService],
})
export class AuthModule extends createConfigurableDynamicRootModule<
  AuthModule,
  AuthModuleOptions
>(AUTH_OPTIONS) { }
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
  ],
})
export class AppModule { }
```

### 




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
