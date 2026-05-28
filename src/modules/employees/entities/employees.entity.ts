import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeEntity {
  @ApiProperty({ example: 'emp_000001' }) id: string;
  @ApiProperty() userId?: string;
  @ApiProperty() name: string;
  @ApiProperty() lastName1: string;
  @ApiProperty() lastName2: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
  @ApiPropertyOptional() personalEmail?: string;
  @ApiPropertyOptional() iban?: string;
  @ApiProperty() cityId: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() categoryId: string;
  @ApiProperty() statusId: string;
  @ApiProperty() active: boolean;
  @ApiProperty() shiftId: string;
  @ApiProperty() schedule: string;
  @ApiProperty() contractTypeId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedEmployeeResponseDto {
  @ApiProperty({ type: [EmployeeEntity] }) data: EmployeeEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
