import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from './dto/employees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, MinLevel } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Empleados')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @MinLevel(2)
  @ApiOperation({ summary: 'Crear un empleado' })
  @ApiResponse({ status: 201, description: 'Empleado creado correctamente' })
  create(@Body() createDto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.employeesService.create(createDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'workCenterId', required: false })
  @ApiQuery({ name: 'statusId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiResponse({ status: 200, description: 'Empleados obtenidos correctamente' })
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por ID' })
  @ApiResponse({ status: 200, description: 'Empleado obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Actualizar un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  update(@Param('id') id: string, @Body() updateDto: UpdateEmployeeDto, @CurrentUser() user: any) {
    return this.employeesService.update(id, updateDto, user?.uid);
  }

  @Delete(':id')
  @Roles('ROOT', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un empleado (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Empleado eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.remove(id, user?.uid);
  }

  @Patch(':id/restore')
  @Roles('ROOT', 'ADMIN')
  @ApiOperation({ summary: 'Restaurar un empleado eliminado' })
  @ApiResponse({ status: 200, description: 'Empleado restaurado correctamente' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.restore(id, user?.uid);
  }
}
