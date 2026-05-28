import { ApiProperty } from '@nestjs/swagger';

export class CityEntity {
  @ApiProperty({ example: 'city-1' })
  id: string;

  @ApiProperty({ example: 'Alcalá de Henares' })
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedCityResponseDto {
  @ApiProperty({ type: [CityEntity] })
  data: CityEntity[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}
