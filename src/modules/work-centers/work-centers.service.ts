import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateWorkCenterDto, UpdateWorkCenterDto } from './dto/work-centers.dto';

@Injectable()
export class WorkCentersService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createDto: CreateWorkCenterDto, userId?: string) {
    const city = await this.prisma.city.findFirst({
      where: { id: createDto.cityId, deletedAt: null },
    });
    if (!city) throw new NotFoundException('Ciudad no encontrada');

    const id = await this.idGenerator.generateId('workCenter');
    const wc = await this.prisma.workCenter.create({
      data: {
        id,
        name: createDto.name,
        address: createDto.address,
        cityId: createDto.cityId,
        status: createDto.status || 'ACTIVE',
        createdBy: userId,
      },
    });

    await this.createAuditLog(undefined, wc, 'CREATE', 'work_center', wc.id, userId);
    this.logger.log(`Centro de trabajo creado: ${wc.name} (${wc.id})`, 'WorkCentersService');
    return wc;
  }

  async findAll(cityId?: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (cityId) where.cityId = cityId;

    const [data, total] = await Promise.all([
      this.prisma.workCenter.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { city: { select: { id: true, name: true } } },
      }),
      this.prisma.workCenter.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const wc = await this.prisma.workCenter.findFirst({
      where: { id, deletedAt: null },
      include: { city: { select: { id: true, name: true } } },
    });
    if (!wc) throw new NotFoundException('Centro de trabajo no encontrado');
    return wc;
  }

  async update(id: string, updateDto: UpdateWorkCenterDto, userId?: string) {
    const wc = await this.findOne(id);

    const updated = await this.prisma.workCenter.update({
      where: { id },
      data: { ...updateDto, updatedBy: userId },
    });

    await this.createAuditLog(wc, updated, 'UPDATE', 'work_center', id, userId);
    this.logger.log(`Centro de trabajo actualizado: ${updated.name}`, 'WorkCentersService');
    return updated;
  }

  async remove(id: string, userId?: string) {
    const wc = await this.findOne(id);

    const hasEmployees = await this.prisma.employee.findFirst({ where: { workCenterId: id, deletedAt: null } });
    const hasVehicles = await this.prisma.vehicle.findFirst({ where: { workCenterId: id, deletedAt: null } });
    const hasServices = await this.prisma.service.findFirst({ where: { workCenterId: id, deletedAt: null } });
    const hasInventory = await this.prisma.inventoryItem.findFirst({ where: { workCenterId: id, deletedAt: null } });

    if (hasEmployees || hasVehicles || hasServices || hasInventory) {
      throw new ConflictException('No se puede eliminar: el centro de trabajo tiene empleados, vehículos, servicios o inventario activos');
    }

    const updated = await this.prisma.workCenter.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.createAuditLog(wc, updated, 'DELETE', 'work_center', id, userId);
    this.logger.log(`Centro de trabajo eliminado (soft): ${wc.name}`, 'WorkCentersService');
    return { message: 'Centro de trabajo eliminado correctamente' };
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
