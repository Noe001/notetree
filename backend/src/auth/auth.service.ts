import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async verifyToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
