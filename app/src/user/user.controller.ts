import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { User } from 'app-lib';
import { CreateUserDto } from './dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) { }

  @Post()
  create(@Body() user: CreateUserDto): Promise<User> {
    return this.userService.insert(user);
  }

  @Get(':id')
  find(@Param('id') id: string): User {
    return this.userService.find(id);
  }

  @Get()
  findAll(@Body() options: { skip?: number, take?: number }): User[] {
    return this.userService.findAll(options.skip || 0, options.take || 6);
  }

  @Delete(':id')
  delete(@Param('id') id: string): void {
    return this.userService.delete(id);
  }

}
