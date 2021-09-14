import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
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