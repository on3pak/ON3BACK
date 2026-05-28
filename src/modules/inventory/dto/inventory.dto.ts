import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryCategory } from '@prisma/client';

export class CreateInventoryItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ enum: InventoryCategory }) @IsEnum(InventoryCategory) @IsNotEmpty() category: InventoryCategory;
  @ApiProperty({ example: 'ist-1' }) @IsString() @IsNotEmpty() subtypeId: string;
  @ApiProperty({ example: 'rs-1' }) @IsString() @IsNotEmpty() statusId: string;
  @ApiProperty({ example: 1 }) @IsNumber() @IsNotEmpty() quantity: number;
  @ApiProperty({ example: 1 }) @IsNumber() @IsNotEmpty() minStock: number;
  @ApiProperty({ example: 'unidades' }) @IsString() @IsNotEmpty() unit: string;
  @ApiProperty({ example: 'city-1' }) @IsString() @IsNotEmpty() cityId: string;
  @ApiProperty({ example: 'wc-1' }) @IsString() @IsNotEmpty() workCenterId: string;
  @ApiProperty({ example: 'Estante A-1' }) @IsString() @IsNotEmpty() location: string;

  @ApiPropertyOptional() @IsString() @IsOptional() serialNumber?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() assignedTo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() size?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() color?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() material?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() gender?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() certification?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() safetyStandard?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() brand?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() model?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() expirationDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() warrantyExpiration?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastMaintenance?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() nextMaintenance?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ enum: InventoryCategory }) @IsEnum(InventoryCategory) @IsOptional() category?: InventoryCategory;
  @ApiPropertyOptional() @IsString() @IsOptional() subtypeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() statusId?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() quantity?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() minStock?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() location?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() serialNumber?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() assignedTo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() size?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() color?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() material?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() gender?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() certification?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() safetyStandard?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() brand?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() model?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() expirationDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() warrantyExpiration?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastMaintenance?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() nextMaintenance?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class InventoryItemResponseDto {
  @ApiProperty({ example: 'inv_000001' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: InventoryCategory }) category: string;
  @ApiProperty() subtypeId: string;
  @ApiProperty() statusId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() minStock: number;
  @ApiProperty() unit: string;
  @ApiProperty() cityId: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() location: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
