import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from 'app-lib';
import { CreateUserDto } from './dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) { }

  @Post('create')
  create(@Body() user: CreateUserDto): User {
    return this.userService.insert(user);
  }
}
