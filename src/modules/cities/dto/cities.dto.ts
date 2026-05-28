import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({ example: 'Alcalá de Henares' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ example: 'Alcalá de Henares' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class CityResponseDto {
  @ApiProperty({ example: 'city-1' })
  id: string;

  @ApiProperty({ example: 'Alcalá de Henares' })
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
