import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'USER001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  userId: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'USER001' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  userId?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ROOT', 'ADMIN', 'MANAGER', 'USER'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}
