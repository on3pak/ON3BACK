import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createDto: CreateInventoryItemDto, userId?: string) {
    const id = await this.idGenerator.generateId('inventory');

    const data: any = {
      id,
      name: createDto.name,
      description: createDto.description || null,
      category: createDto.category,
      subtypeId: createDto.subtypeId,
      statusId: createDto.statusId,
      serialNumber: createDto.serialNumber || null,
      quantity: createDto.quantity,
      minStock: createDto.minStock,
      unit: createDto.unit,
      cityId: createDto.cityId,
      workCenterId: createDto.workCenterId,
      location: createDto.location,
      assignedTo: createDto.assignedTo || null,
      size: createDto.size || null,
      color: createDto.color || null,
      material: createDto.material || null,
      gender: createDto.gender || null,
      certification: createDto.certification || null,
      safetyStandard: createDto.safetyStandard || null,
      brand: createDto.brand || null,
      model: createDto.model || null,
      expirationDate: createDto.expirationDate ? new Date(createDto.expirationDate) : null,
      warrantyExpiration: createDto.warrantyExpiration ? new Date(createDto.warrantyExpiration) : null,
      lastMaintenance: createDto.lastMaintenance ? new Date(createDto.lastMaintenance) : null,
      nextMaintenance: createDto.nextMaintenance ? new Date(createDto.nextMaintenance) : null,
      notes: createDto.notes || null,
      createdBy: userId,
    };

    const item = await this.prisma.inventoryItem.create({ data });

    await this.createAuditLog(undefined, item, 'CREATE', 'inventory_item', item.id, userId);
    this.logger.log(`Item de inventario creado: ${item.name} (${item.id})`, 'InventoryService');
    return item;
  }

  async findAll(
    cityId?: string, workCenterId?: string, category?: string, lowStock?: boolean,
    page = 1, pageSize = 10,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (cityId) where.cityId = cityId;
    if (workCenterId) where.workCenterId = workCenterId;
    if (category) where.category = category;
    if (lowStock) {
      where.quantity = { lt: this.prisma.inventoryItem.fields.minStock };
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          subtype: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } },
          city: { select: { id: true, name: true } },
          workCenter: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        subtype: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundException('Item de inventario no encontrado');
    return item;
  }

  async update(id: string, updateDto: UpdateInventoryItemDto, userId?: string) {
    const item = await this.findOne(id);

    const data: any = { ...updateDto, updatedBy: userId };
    if (updateDto.expirationDate) data.expirationDate = new Date(updateDto.expirationDate);
    if (updateDto.warrantyExpiration) data.warrantyExpiration = new Date(updateDto.warrantyExpiration);
    if (updateDto.lastMaintenance) data.lastMaintenance = new Date(updateDto.lastMaintenance);
    if (updateDto.nextMaintenance) data.nextMaintenance = new Date(updateDto.nextMaintenance);

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data,
    });

    await this.createAuditLog(item, updated, 'UPDATE', 'inventory_item', id, userId);
    this.logger.log(`Item de inventario actualizado: ${updated.name}`, 'InventoryService');
    return updated;
  }

  async remove(id: string, userId?: string) {
    const item = await this.findOne(id);

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.createAuditLog(item, updated, 'DELETE', 'inventory_item', id, userId);
    this.logger.log(`Item de inventario eliminado (soft): ${item.name}`, 'InventoryService');
    return { message: 'Item de inventario eliminado correctamente' };
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
