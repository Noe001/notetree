import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header missing or invalid');
    }

    const token = authHeader.substring(7);
    
    try {
      // Handle mock JWT tokens for testing
    // Mock JWT handling should only be enabled in development/test environments
    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_jwt_')) {
      const parts = token.split('_');
      if (parts.length >= 3) {
        // Use the created user ID for consistent testing
        const userId = '0bfbe520-bae0-41b1-95da-cf9a6b00c351';
        request.user = { id: userId, sub: userId };
        return true;
      }
      return false;
    }

      // First, try to verify the token as a Supabase JWT
      try {
        const supabaseUser = await this.supabaseAuthService.verifySupabaseToken(token);
        if (supabaseUser) {
          request.user = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email,
            sub: supabaseUser.id
          };
          return true;
        }
      } catch (supabaseError) {
        // If Supabase verification fails, continue to local JWT verification
      }

      // Verify the JWT token using JwtService (local authentication)
      const decoded = this.jwtService.verify(token);
      request.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        sub: decoded.sub
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
