import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService<{ JWT_SECRET: string }>) {}

  sign(payload: object): string {
    const secret = this.configService.get('JWT_SECRET', { infer: true });
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(
      payload,
      secret,
      { expiresIn: '1d' }
    );
  }

  verify<T extends object = any>(token: string): T {
    const secret = this.configService.get('JWT_SECRET', { infer: true });
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, secret) as T;
  }
}
