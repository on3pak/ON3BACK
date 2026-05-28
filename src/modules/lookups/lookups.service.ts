import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class LookupsService {
  constructor(private prisma: PrismaService) {}

  async getEmployeeCategories() {
    return this.prisma.employeeCategory.findMany({ orderBy: { id: 'asc' } });
  }

  async getEmployeeStatuses() {
    return this.prisma.employeeStatus.findMany({ orderBy: { id: 'asc' } });
  }

  async getWorkDays() {
    return this.prisma.workDay.findMany({ orderBy: { id: 'asc' } });
  }

  async getShifts() {
    return this.prisma.shift.findMany({ orderBy: { id: 'asc' } });
  }

  async getContractTypes() {
    return this.prisma.contractType.findMany({ orderBy: { id: 'asc' } });
  }

  async getVehicleTypes() {
    return this.prisma.vehicleTypeOption.findMany({ orderBy: { id: 'asc' } });
  }

  async getInventoryCategories() {
    return this.prisma.inventoryCategoryOption.findMany({ orderBy: { id: 'asc' } });
  }

  async getInventorySubtypes(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.prisma.inventorySubtype.findMany({ where, orderBy: { id: 'asc' } });
  }

  async getInventoryStatuses() {
    return this.prisma.inventoryStatus.findMany({ orderBy: { id: 'asc' } });
  }
}
