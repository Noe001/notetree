import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      });
  }

  async validate(payload: any) {
    // Supabaseトークンの検証を試みる
    // Note: ExtractJwt.fromAuthHeaderAsBearerToken()は関数であり、直接ヘッダーを取得するものではない
    // 実際のトークン検証はpassport-jwtが行うため、ここではpayloadからユーザー情報を取得する
    try {
      // payload.subがSupabaseのユーザーIDの形式の場合、Supabaseからユーザー情報を取得
      if (payload.sub && payload.sub.length > 20) { // UUIDの長さをチェック
        const supabaseUser = await this.supabaseAuthService.getUserById(payload.sub);
        if (supabaseUser) {
          return {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email,
            username: supabaseUser.email,
            created_at: supabaseUser.created_at,
            updated_at: supabaseUser.updated_at
          };
        }
      }
    } catch (error) {
      // Supabaseユーザーの取得に失敗した場合は、既存のローカル認証を試す
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
