import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerData: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(registerData.password, 10);
    const user = await this.userService.create({
      ...registerData,
      password: hashedPassword,
    });
    const { password, ...result } = user;
    return this.login(result);
  }

  

  async updateProfile(userId: string, updateData: any): Promise<Omit<User, 'password'>> {
    const user = await this.userService.update(userId, updateData);
    const { password, ...result } = user;
    return result;
  }

  async verifyToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
