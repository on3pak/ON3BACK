import { IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'emp_000001' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roleId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'm.torres' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'Miguel Ángel Torres' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roleId?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional({ enum: UserStatus }) @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() cityId?: string;
  @ApiPropertyOptional() @IsOptional() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() limit?: number = 10;
}
