import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus, FuelType } from '@prisma/client';

export class VehicleEntity {
  @ApiProperty({ example: 'veh_v001' }) id: string;
  @ApiProperty({ example: '1234BCD' }) licensePlate: string;
  @ApiProperty() model: string;
  @ApiProperty() brand: string;
  @ApiProperty() vehicleTypeId: string;
  @ApiProperty({ enum: VehicleStatus }) status: VehicleStatus;
  @ApiProperty() vin: string;
  @ApiProperty({ enum: FuelType }) fuelType: FuelType;
  @ApiProperty() kilometers: number;
  @ApiProperty() workCenterId: string;
  @ApiProperty() assignedEmployeeId?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedVehicleResponseDto {
  @ApiProperty({ type: [VehicleEntity] }) data: VehicleEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
