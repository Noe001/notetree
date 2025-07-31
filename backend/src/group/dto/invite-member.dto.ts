import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { GroupMemberRole } from '../types';

export class InviteMemberDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(GroupMemberRole)
  @IsOptional()
  role?: GroupMemberRole;
}
