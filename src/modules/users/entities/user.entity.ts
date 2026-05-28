import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'emp_000001' }) employeeId: string;
  @ApiProperty({ example: 'm.torres' }) username: string;
  @ApiProperty({ example: 'm.torres@on3.com' }) email: string;
  @ApiProperty({ example: 'Miguel Ángel Torres' }) fullName: string;
  @ApiPropertyOptional() role?: { id: string; name: string; level: string };
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] }) status: string;
  @ApiProperty({ example: 'city-1' }) cityId: string;
  @ApiPropertyOptional() lastLoginAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] }) data: UserResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
