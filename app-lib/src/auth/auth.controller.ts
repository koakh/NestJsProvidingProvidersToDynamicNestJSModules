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
