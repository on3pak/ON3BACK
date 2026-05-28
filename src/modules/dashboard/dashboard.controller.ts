import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen del dashboard' })
  @ApiQuery({ name: 'cityId', required: false })
  getSummary(@Query('cityId') cityId?: string) {
    return this.dashboardService.getSummary(cityId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertas (ITV, mantenimiento, stock bajo)' })
  @ApiQuery({ name: 'cityId', required: false })
  getAlerts(@Query('cityId') cityId?: string) {
    return this.dashboardService.getAlerts(cityId);
  }
}
