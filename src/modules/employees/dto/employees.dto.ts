import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VacationMonth } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Miguel' }) @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: 'Ángel' }) @IsString() @IsNotEmpty() lastName1: string;
  @ApiProperty({ example: 'Torres' }) @IsString() @IsNotEmpty() lastName2: string;
  @ApiProperty({ example: '612345678' }) @IsString() @IsNotEmpty() phone: string;
  @ApiProperty({ example: 'ec-1' }) @IsString() @IsNotEmpty() categoryId: string;
  @ApiProperty({ example: 'es-1' }) @IsString() @IsNotEmpty() statusId: string;
  @ApiProperty({ example: 'wc-1' }) @IsString() @IsNotEmpty() workCenterId: string;
  @ApiProperty({ example: 's-1' }) @IsString() @IsNotEmpty() shiftId: string;
  @ApiProperty({ example: '08:00-16:00' }) @IsString() @IsNotEmpty() schedule: string;
  @ApiProperty({ example: '08:00' }) @IsString() @IsNotEmpty() startTime: string;
  @ApiProperty({ example: '16:00' }) @IsString() @IsNotEmpty() endTime: string;
  @ApiProperty({ example: 'wd-1' }) @IsString() @IsNotEmpty() workDayId: string;
  @ApiProperty({ example: 'ct-1' }) @IsString() @IsNotEmpty() contractTypeId: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() contractStartDate: string;

  @ApiPropertyOptional() @IsString() @IsOptional() personalEmail?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phoneFixed?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() iban?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() locker?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() medicalCheck?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() worksHolidays?: boolean;
  @ApiPropertyOptional() @IsNumber() @IsOptional() irpf?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() vacationDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() ownDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() accumulatedDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() excessDays?: number;
  @ApiPropertyOptional({ enum: VacationMonth }) @IsEnum(VacationMonth) @IsOptional() vacationMonth?: VacationMonth;
  @ApiPropertyOptional() @IsNumber() @IsOptional() vacationYear?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() contractEndDate?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastName1?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastName2?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() personalEmail?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phoneFixed?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() iban?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() locker?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() categoryId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() statusId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() workCenterId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() shiftId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() schedule?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() startTime?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() endTime?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() workDayId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() contractTypeId?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() contractStartDate?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() contractEndDate?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() active?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() medicalCheck?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() worksHolidays?: boolean;
  @ApiPropertyOptional() @IsNumber() @IsOptional() irpf?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() vacationDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() ownDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() accumulatedDays?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() excessDays?: number;
  @ApiPropertyOptional({ enum: VacationMonth }) @IsEnum(VacationMonth) @IsOptional() vacationMonth?: VacationMonth;
  @ApiPropertyOptional() @IsNumber() @IsOptional() vacationYear?: number;
}

export class EmployeeQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() userIdNull?: string;
  @ApiPropertyOptional() @IsOptional() page?: number = 1;
  @ApiPropertyOptional() @IsOptional() pageSize?: number = 10;
  @ApiPropertyOptional() @IsOptional() @IsString() sort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() order?: 'asc' | 'desc';
}

export class EmployeeResponseDto {
  @ApiProperty({ example: 'emp_000001' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() lastName1: string;
  @ApiProperty() lastName2: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
  @ApiProperty() categoryId: string;
  @ApiProperty() statusId: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() cityId: string;
  @ApiProperty() shiftId: string;
  @ApiProperty() schedule: string;
  @ApiProperty() workDayId: string;
  @ApiProperty() active: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
