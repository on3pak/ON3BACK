import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(cityId?: string) {
    const cityWhere = cityId ? { cityId } : {};
    const wcFilter = cityId ? { workCenter: { cityId } } : {};
    const invCityFilter = cityId ? { cityId } : {};

    const [activeEmployees, totalVehicles, totalServices, lowStockItems, vehicleExpirations] = await Promise.all([
      this.prisma.employee.count({
        where: { ...cityWhere, active: true, deletedAt: null },
      }),
      this.prisma.vehicle.count({
        where: { ...wcFilter, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { ...wcFilter, deletedAt: null },
      }),
      this.prisma.inventoryItem.count({
        where: { ...invCityFilter, deletedAt: null, quantity: { lt: this.prisma.inventoryItem.fields.minStock } },
      }),
      this.prisma.vehicle.count({
        where: {
          ...wcFilter,
          deletedAt: null,
          itvExpiration: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      activeEmployees,
      totalVehicles,
      totalServices,
      lowStockItems,
      vehicleExpirations: { next30Days: vehicleExpirations },
    };
  }

  async getAlerts(cityId?: string) {
    const wcFilter = cityId ? { workCenter: { cityId } } : {};
    const invCityFilter = cityId ? { cityId } : {};
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [itvAlerts, maintenanceAlerts, lowStock] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: {
          ...wcFilter,
          deletedAt: null,
          itvExpiration: { gte: now, lte: next30Days },
        },
        orderBy: { itvExpiration: 'asc' },
        take: 20,
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          ...invCityFilter,
          deletedAt: null,
          category: 'maquinaria',
          nextMaintenance: { gte: now, lte: next30Days },
        },
        orderBy: { nextMaintenance: 'asc' },
        take: 20,
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          ...invCityFilter,
          deletedAt: null,
          quantity: { lt: this.prisma.inventoryItem.fields.minStock },
        },
        orderBy: { quantity: 'asc' },
        take: 20,
      }),
    ]);

    return { itvAlerts, maintenanceAlerts, lowStock };
  }
}
