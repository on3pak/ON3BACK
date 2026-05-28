import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, UpdateTaskStatusDto } from './dto/services.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinLevel } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Servicios')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @MinLevel(2)
  @ApiOperation({ summary: 'Crear un servicio (genera 140 tareas automáticamente)' })
  @ApiResponse({ status: 201, description: 'Servicio creado correctamente' })
  create(@Body() createDto: CreateServiceDto, @CurrentUser() user: any) {
    return this.servicesService.create(createDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar servicios con progreso' })
  @ApiQuery({ name: 'workCenterId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Query('workCenterId') workCenterId?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.servicesService.findAll(workCenterId, page || 1, pageSize || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio con tareas y progreso' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Actualizar un servicio' })
  update(@Param('id') id: string, @Body() updateDto: UpdateServiceDto, @CurrentUser() user: any) {
    return this.servicesService.update(id, updateDto, user?.uid);
  }

  @Delete(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Eliminar un servicio (soft-delete en cascada a tareas)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.remove(id, user?.uid);
  }

  @Patch(':id/tasks/:taskId')
  @MinLevel(2)
  @ApiOperation({ summary: 'Actualizar estado de una tarea' })
  updateTaskStatus(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.servicesService.updateTaskStatus(id, { taskId, status: body.status as any }, user?.uid);
  }
}
