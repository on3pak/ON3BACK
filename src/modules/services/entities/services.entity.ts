import { ApiProperty } from '@nestjs/swagger';

export class ServiceEntity {
  @ApiProperty({ example: 'svc_1' }) id: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty() totalTasks: number;
  @ApiProperty() completedTasks: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedServiceResponseDto {
  @ApiProperty({ type: [ServiceEntity] }) data: ServiceEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
