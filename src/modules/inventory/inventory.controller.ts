import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinLevel } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventario')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @MinLevel(2)
  @ApiOperation({ summary: 'Crear un item de inventario' })
  @ApiResponse({ status: 201, description: 'Item creado correctamente' })
  create(@Body() createDto: CreateInventoryItemDto, @CurrentUser() user: any) {
    return this.inventoryService.create(createDto, user?.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inventario' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'workCenterId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'lowStock', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Query('cityId') cityId?: string,
    @Query('workCenterId') workCenterId?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.inventoryService.findAll(cityId, workCenterId, category, lowStock === 'true', page || 1, pageSize || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un item de inventario' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Actualizar un item de inventario' })
  update(@Param('id') id: string, @Body() updateDto: UpdateInventoryItemDto, @CurrentUser() user: any) {
    return this.inventoryService.update(id, updateDto, user?.uid);
  }

  @Delete(':id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Eliminar un item de inventario (soft-delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.remove(id, user?.uid);
  }
}
