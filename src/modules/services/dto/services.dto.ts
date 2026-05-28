import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({ example: 'wc-1' }) @IsString() @IsNotEmpty() workCenterId: string;
  @ApiProperty({ example: 'BMIX1' }) @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: 'BARRIDO MIXTO' }) @IsString() @IsNotEmpty() type: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() type?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() taskId: string;
  @ApiProperty({ enum: TaskStatus }) @IsEnum(TaskStatus) @IsNotEmpty() status: TaskStatus;
}

export class ServiceResponseDto {
  @ApiProperty({ example: 'svc_1' }) id: string;
  @ApiProperty() workCenterId: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty() totalTasks: number;
  @ApiProperty() completedTasks: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
