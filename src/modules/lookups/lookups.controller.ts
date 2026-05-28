import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LookupsService } from './lookups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Catálogos (Lookups)')
@Controller('lookups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('employee-categories')
  @ApiOperation({ summary: 'Categorías de empleado' })
  getEmployeeCategories() {
    return this.lookupsService.getEmployeeCategories();
  }

  @Get('employee-statuses')
  @ApiOperation({ summary: 'Estados de empleado' })
  getEmployeeStatuses() {
    return this.lookupsService.getEmployeeStatuses();
  }

  @Get('work-days')
  @ApiOperation({ summary: 'Jornadas laborales' })
  getWorkDays() {
    return this.lookupsService.getWorkDays();
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Turnos' })
  getShifts() {
    return this.lookupsService.getShifts();
  }

  @Get('contract-types')
  @ApiOperation({ summary: 'Tipos de contrato' })
  getContractTypes() {
    return this.lookupsService.getContractTypes();
  }

  @Get('vehicle-types')
  @ApiOperation({ summary: 'Tipos de vehículo' })
  getVehicleTypes() {
    return this.lookupsService.getVehicleTypes();
  }

  @Get('inventory-categories')
  @ApiOperation({ summary: 'Categorías de inventario' })
  getInventoryCategories() {
    return this.lookupsService.getInventoryCategories();
  }

  @Get('inventory-subtypes')
  @ApiOperation({ summary: 'Subtipos de inventario' })
  @ApiQuery({ name: 'category', required: false })
  getInventorySubtypes(@Query('category') category?: string) {
    return this.lookupsService.getInventorySubtypes(category);
  }

  @Get('inventory-statuses')
  @ApiOperation({ summary: 'Estados de inventario' })
  getInventoryStatuses() {
    return this.lookupsService.getInventoryStatuses();
  }
}
