import { ApiProperty } from '@nestjs/swagger';
import { WorkCenterStatus } from '@prisma/client';

export class WorkCenterEntity {
  @ApiProperty({ example: 'wc-1' })
  id: string;

  @ApiProperty({ example: 'Nave Central' })
  name: string;

  @ApiProperty({ example: 'Calle Mayor 15' })
  address: string;

  @ApiProperty({ example: 'city-1' })
  cityId: string;

  @ApiProperty({ enum: WorkCenterStatus })
  status: WorkCenterStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedWorkCenterResponseDto {
  @ApiProperty({ type: [WorkCenterEntity] })
  data: WorkCenterEntity[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}
