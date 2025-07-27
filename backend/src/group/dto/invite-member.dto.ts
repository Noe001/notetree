import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { GroupMemberRole } from '../group-member.entity';

export class InviteMemberDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(GroupMemberRole)
  @IsOptional()
  role?: GroupMemberRole = GroupMemberRole.MEMBER;
} 
