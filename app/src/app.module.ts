import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController, AuthModule, AuthService } from 'app-lib';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
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
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule { }