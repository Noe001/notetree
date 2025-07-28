import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateMemoDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  // @IsString()
  // @IsOptional()
  // groupId?: string;
} 
