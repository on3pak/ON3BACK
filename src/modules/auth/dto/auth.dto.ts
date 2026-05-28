import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '000001@on3.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'root' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'newuser@on3.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'newuser' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'New User' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'ES', enum: ['ES', 'EN'] })
  @IsString()
  @IsOptional()
  language?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  user!: {
    uid: string;
    email: string;
    fullName: string;
    username: string;
    role: string;
    status: string;
    language: string;
  };
}
