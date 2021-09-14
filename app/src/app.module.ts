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