import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkCenterStatus } from '@prisma/client';

export class CreateWorkCenterDto {
  @ApiProperty({ example: 'Nave Central' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calle Mayor 15' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'city-1' })
  @IsString()
  @IsNotEmpty()
  cityId: string;

  @ApiPropertyOptional({ enum: WorkCenterStatus, default: 'ACTIVE' })
  @IsEnum(WorkCenterStatus)
  @IsOptional()
  status?: WorkCenterStatus;
}

export class UpdateWorkCenterDto {
  @ApiPropertyOptional({ example: 'Nave Central' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Calle Mayor 15' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: WorkCenterStatus })
  @IsEnum(WorkCenterStatus)
  @IsOptional()
  status?: WorkCenterStatus;
}

export class WorkCenterResponseDto {
  @ApiProperty({ example: 'wc-1' })
  id: string;

  @ApiProperty({ example: 'Nave Central' })
  name: string;

  @ApiProperty({ example: 'Calle Mayor 15' })
  address: string;

  @ApiProperty({ example: 'city-1' })
  cityId: string;

  @ApiProperty({ enum: WorkCenterStatus })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
