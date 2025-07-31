import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_key',
    });
  }

  async validate(payload: any) {
    // Mock token processing
    if (payload.sub && payload.sub.startsWith('mock_jwt_')) {
      return {
        id: '0bfbe520-bae0-41b1-95da-cf9a6b00c351',
        email: 'mock@example.com',
        name: 'Mock User',
        username: 'mockuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
