import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

type EntityType = 'city' | 'workCenter' | 'employee' | 'vehicle' | 'service' | 'inventory';

@Injectable()
export class IdGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateId(entity: EntityType): Promise<string> {
    switch (entity) {
      case 'city':
        return this.generateSequentialId('city', 'city-');
      case 'workCenter':
        return this.generateSequentialId('workCenter', 'wc-');
      case 'employee':
        return this.generateZeroPaddedId('employee', 'emp_', 6);
      case 'vehicle':
        return this.generateZeroPaddedId('vehicle', 'veh_v', 3);
      case 'service':
        return this.generateSequentialId('service', 'svc_');
      case 'inventory':
        return this.generateZeroPaddedId('inventoryItem', 'inv_', 6);
    }
  }

  private async generateSequentialId(entity: string, prefix: string): Promise<string> {
    const model = this.getPrismaModel(entity);
    const last = await (this.prisma as any)[model].findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    let nextNum = 1;
    if (last) {
      const num = parseInt(last.id.replace(prefix, ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}${nextNum}`;
  }

  private async generateZeroPaddedId(entity: string, prefix: string, digits: number): Promise<string> {
    const model = this.getPrismaModel(entity);
    const last = await (this.prisma as any)[model].findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    let nextNum = 1;
    if (last) {
      const num = parseInt(last.id.replace(prefix, ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}${String(nextNum).padStart(digits, '0')}`;
  }

  private getPrismaModel(entity: string): string {
    const map: Record<string, string> = {
      city: 'city',
      workCenter: 'workCenter',
      employee: 'employee',
      vehicle: 'vehicle',
      service: 'service',
      inventoryItem: 'inventoryItem',
    };
    return map[entity] || entity;
  }
}
