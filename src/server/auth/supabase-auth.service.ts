import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseAuthService {
  private supabase;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'http://localhost:8000';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.M5I029KMgBfIY5CiC4Gsv9PE9VBiTIMa_W3TJWtG7Mg';
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async verifySupabaseToken(token: string): Promise<any> {
    try {
      // SupabaseのJWTトークンを検証
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        throw new UnauthorizedException('Invalid token');
      }
      
      return data.user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      
      if (error) {
        throw new UnauthorizedException('User not found');
      }
      
      return data.user;
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
}