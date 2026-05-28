import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryCategory } from '@prisma/client';

export class InventoryItemEntity {
  @ApiProperty({ example: 'inv_000001' }) id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: InventoryCategory }) category: InventoryCategory;
  @ApiProperty() subtypeId: string;
  @ApiProperty() statusId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() minStock: number;
  @ApiProperty() unit: string;
  @ApiProperty() cityId: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() location: string;
  @ApiPropertyOptional() assignedTo?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedInventoryResponseDto {
  @ApiProperty({ type: [InventoryItemEntity] }) data: InventoryItemEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
