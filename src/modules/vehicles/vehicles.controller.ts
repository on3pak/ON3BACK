import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinLevel } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vehículos')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @MinLevel(2)
  @ApiOperation({ summary: 'Crear un vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado correctamente' })
  @ApiResponse({ status: 409, description: 'Matrícula o bastidor duplicado' })
  create(@Body() createDto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.vehiclesService.create(createDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  @ApiQuery({ name: 'workCenterId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Query('workCenterId') workCenterId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.vehiclesService.findAll(workCenterId, status, page || 1, pageSize || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  update(@Param('id') id: string, @Body() updateDto: UpdateVehicleDto, @CurrentUser() user: any) {
    return this.vehiclesService.update(id, updateDto, user?.uid);
  }

  @Delete(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Eliminar un vehículo (soft-delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vehiclesService.remove(id, user?.uid);
  }
}
