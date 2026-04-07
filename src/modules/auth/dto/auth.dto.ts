import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '11111' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

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
  @ApiProperty({ example: 'user123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  userId!: string;

  @ApiProperty({ example: 'newuser' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'newuser@example.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  user!: {
    id: string;
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}
