import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus, FuelType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: '1234BCD' }) @IsString() @IsNotEmpty() licensePlate: string;
  @ApiProperty({ example: 'Transit' }) @IsString() @IsNotEmpty() model: string;
  @ApiProperty({ example: 'Ford' }) @IsString() @IsNotEmpty() brand: string;
  @ApiProperty({ example: 'vt-1' }) @IsString() @IsNotEmpty() vehicleTypeId: string;
  @ApiProperty({ example: 'WBA3A5C5XDF123456' }) @IsString() @IsNotEmpty() vin: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() registrationDate: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() itvExpiration: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() insuranceExpiration: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() taxExpiration: string;
  @ApiProperty({ enum: FuelType }) @IsEnum(FuelType) @IsNotEmpty() fuelType: FuelType;
  @ApiProperty({ example: 0 }) @IsNumber() @IsNotEmpty() kilometers: number;
  @ApiProperty({ example: 'wc-1' }) @IsString() @IsNotEmpty() workCenterId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() assignedEmployeeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() observations?: string;
  @ApiPropertyOptional({ enum: VehicleStatus }) @IsEnum(VehicleStatus) @IsOptional() status?: VehicleStatus;
  @ApiPropertyOptional() @IsDateString() @IsOptional() lastReviewDate?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() nextReviewKilometers?: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional() @IsString() @IsOptional() licensePlate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() model?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() brand?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vehicleTypeId?: string;
  @ApiPropertyOptional({ enum: VehicleStatus }) @IsEnum(VehicleStatus) @IsOptional() status?: VehicleStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() vin?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() itvExpiration?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() insuranceExpiration?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() taxExpiration?: string;
  @ApiPropertyOptional({ enum: FuelType }) @IsEnum(FuelType) @IsOptional() fuelType?: FuelType;
  @ApiPropertyOptional() @IsNumber() @IsOptional() kilometers?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() lastReviewDate?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() nextReviewKilometers?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() assignedEmployeeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() observations?: string;
}

export class VehicleResponseDto {
  @ApiProperty({ example: 'veh_v001' }) id: string;
  @ApiProperty({ example: '1234BCD' }) licensePlate: string;
  @ApiProperty() model: string;
  @ApiProperty() brand: string;
  @ApiProperty() vehicleTypeId: string;
  @ApiProperty({ enum: VehicleStatus }) status: string;
  @ApiProperty() kilometers: number;
  @ApiProperty() workCenterId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
