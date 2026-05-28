import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto, UpdateCityDto } from './dto/cities.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Ciudades')
@Controller('cities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @Roles('ROOT')
  @ApiOperation({ summary: 'Crear una ciudad' })
  @ApiResponse({ status: 201, description: 'Ciudad creada correctamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una ciudad con ese nombre' })
  create(@Body() createCityDto: CreateCityDto, @CurrentUser() user: any) {
    return this.citiesService.create(createCityDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ciudades' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, description: 'Ciudades obtenidas correctamente' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.citiesService.findAll(page || 1, pageSize || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ciudad por ID' })
  @ApiResponse({ status: 200, description: 'Ciudad obtenida correctamente' })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ROOT')
  @ApiOperation({ summary: 'Actualizar una ciudad' })
  @ApiResponse({ status: 200, description: 'Ciudad actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto, @CurrentUser() user: any) {
    return this.citiesService.update(id, updateCityDto, user?.uid);
  }

  @Delete(':id')
  @Roles('ROOT')
  @ApiOperation({ summary: 'Eliminar una ciudad (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Ciudad eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene centros de trabajo activos' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.citiesService.remove(id, user?.uid);
  }
}
