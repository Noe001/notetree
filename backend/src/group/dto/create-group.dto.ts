import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
