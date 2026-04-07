import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: ['ROOT', 'ADMIN', 'MANAGER', 'USER'] })
  @IsEnum(['ROOT', 'ADMIN', 'MANAGER', 'USER'])
  level: 'ROOT' | 'ADMIN' | 'MANAGER' | 'USER';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['ROOT', 'ADMIN', 'MANAGER', 'USER'] })
  @IsEnum(['ROOT', 'ADMIN', 'MANAGER', 'USER'])
  @IsOptional()
  level?: 'ROOT' | 'ADMIN' | 'MANAGER' | 'USER';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}