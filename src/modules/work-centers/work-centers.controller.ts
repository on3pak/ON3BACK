import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkCentersService } from './work-centers.service';
import { CreateWorkCenterDto, UpdateWorkCenterDto } from './dto/work-centers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Centros de Trabajo')
@Controller('work-centers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkCentersController {
  constructor(private readonly workCentersService: WorkCentersService) {}

  @Post()
  @Roles('ROOT', 'ADMIN')
  @ApiOperation({ summary: 'Crear un centro de trabajo' })
  @ApiResponse({ status: 201, description: 'Centro de trabajo creado correctamente' })
  create(@Body() createDto: CreateWorkCenterDto, @CurrentUser() user: any) {
    return this.workCentersService.create(createDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar centros de trabajo' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, description: 'Centros obtenidos correctamente' })
  findAll(
    @Query('cityId') cityId?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.workCentersService.findAll(cityId, page || 1, pageSize || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un centro de trabajo por ID' })
  @ApiResponse({ status: 200, description: 'Centro obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Centro no encontrado' })
  findOne(@Param('id') id: string) {
    return this.workCentersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ROOT', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar un centro de trabajo' })
  @ApiResponse({ status: 200, description: 'Centro actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Centro no encontrado' })
  update(@Param('id') id: string, @Body() updateDto: UpdateWorkCenterDto, @CurrentUser() user: any) {
    return this.workCentersService.update(id, updateDto, user?.uid);
  }

  @Delete(':id')
  @Roles('ROOT', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un centro de trabajo (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Centro eliminado correctamente' })
  @ApiResponse({ status: 409, description: 'Tiene elementos activos asociados' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workCentersService.remove(id, user?.uid);
  }
}
