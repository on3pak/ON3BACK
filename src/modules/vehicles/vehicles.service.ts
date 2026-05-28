import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createDto: CreateVehicleDto, userId?: string) {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        OR: [
          { licensePlate: createDto.licensePlate, deletedAt: null },
          { vin: createDto.vin, deletedAt: null },
        ],
      },
    });
    if (existing) throw new ConflictException('Ya existe un vehículo con esa matrícula o bastidor');

    const id = await this.idGenerator.generateId('vehicle');
    const vehicle = await this.prisma.vehicle.create({
      data: {
        id,
        licensePlate: createDto.licensePlate,
        model: createDto.model,
        brand: createDto.brand,
        vehicleTypeId: createDto.vehicleTypeId,
        status: createDto.status || 'ACTIVO',
        vin: createDto.vin,
        registrationDate: new Date(createDto.registrationDate),
        itvExpiration: new Date(createDto.itvExpiration),
        insuranceExpiration: new Date(createDto.insuranceExpiration),
        taxExpiration: new Date(createDto.taxExpiration),
        fuelType: createDto.fuelType,
        kilometers: createDto.kilometers,
        lastReviewDate: createDto.lastReviewDate ? new Date(createDto.lastReviewDate) : null,
        nextReviewKilometers: createDto.nextReviewKilometers || null,
        workCenterId: createDto.workCenterId,
        assignedEmployeeId: createDto.assignedEmployeeId || null,
        observations: createDto.observations || null,
        createdBy: userId,
      },
      include: {
        vehicleType: { select: { id: true, name: true, type: true } },
        workCenter: { select: { id: true, name: true } },
        assignedEmployee: { select: { id: true, name: true, lastName1: true } },
      },
    });

    await this.createAuditLog(undefined, vehicle, 'CREATE', 'vehicle', vehicle.id, userId);
    this.logger.log(`Vehículo creado: ${vehicle.licensePlate} (${vehicle.id})`, 'VehiclesService');
    return vehicle;
  }

  async findAll(workCenterId?: string, status?: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (workCenterId) where.workCenterId = workCenterId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicleType: { select: { id: true, name: true, type: true } },
          workCenter: { select: { id: true, name: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicleType: { select: { id: true, name: true, type: true } },
        workCenter: { select: { id: true, name: true } },
        assignedEmployee: { select: { id: true, name: true, lastName1: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async update(id: string, updateDto: UpdateVehicleDto, userId?: string) {
    const vehicle = await this.findOne(id);

    if (updateDto.licensePlate && updateDto.licensePlate !== vehicle.licensePlate) {
      const dup = await this.prisma.vehicle.findFirst({
        where: { licensePlate: updateDto.licensePlate, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe un vehículo con esa matrícula');
    }

    const data: any = { ...updateDto, updatedBy: userId };
    if (updateDto.itvExpiration) data.itvExpiration = new Date(updateDto.itvExpiration);
    if (updateDto.insuranceExpiration) data.insuranceExpiration = new Date(updateDto.insuranceExpiration);
    if (updateDto.taxExpiration) data.taxExpiration = new Date(updateDto.taxExpiration);
    if (updateDto.lastReviewDate) data.lastReviewDate = new Date(updateDto.lastReviewDate);

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data,
    });

    await this.createAuditLog(vehicle, updated, 'UPDATE', 'vehicle', id, userId);
    this.logger.log(`Vehículo actualizado: ${updated.licensePlate}`, 'VehiclesService');
    return updated;
  }

  async remove(id: string, userId?: string) {
    const vehicle = await this.findOne(id);

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.createAuditLog(vehicle, updated, 'DELETE', 'vehicle', id, userId);
    this.logger.log(`Vehículo eliminado (soft): ${vehicle.licensePlate}`, 'VehiclesService');
    return { message: 'Vehículo eliminado correctamente' };
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
