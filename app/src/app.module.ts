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