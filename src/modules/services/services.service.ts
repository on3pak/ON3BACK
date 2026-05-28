import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateServiceDto, UpdateServiceDto, UpdateTaskStatusDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createDto: CreateServiceDto, userId?: string) {
    const wc = await this.prisma.workCenter.findFirst({
      where: { id: createDto.workCenterId, deletedAt: null },
    });
    if (!wc) throw new BadRequestException('Centro de trabajo no encontrado');

    const id = await this.idGenerator.generateId('service');

    const service = await this.prisma.service.create({
      data: {
        id,
        workCenterId: createDto.workCenterId,
        name: createDto.name,
        type: createDto.type,
        createdBy: userId,
      },
    });

    const tasksData = [];
    for (let day = 0; day < 7; day++) {
      for (let task = 0; task < 20; task++) {
        tasksData.push({
          serviceId: id,
          dayIndex: day,
          taskIndex: task,
          description: `Tarea ${task + 1} - Día ${day + 1}`,
          status: 'PENDING' as const,
        });
      }
    }

    await this.prisma.serviceTask.createMany({ data: tasksData });

    await this.createAuditLog(undefined, service, 'CREATE', 'service', service.id, userId);
    this.logger.log(`Servicio creado: ${service.name} (${service.id}) con 140 tareas`, 'ServicesService');
    return this.getServiceWithProgress(id);
  }

  async findAll(workCenterId?: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where: any = { deletedAt: null };
    if (workCenterId) where.workCenterId = workCenterId;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          workCenter: { select: { id: true, name: true } },
          tasks: { where: { deletedAt: null }, select: { status: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    const data = services.map((s) => ({
      ...s,
      totalTasks: s.tasks.length,
      completedTasks: s.tasks.filter((t) => t.status === 'COMPLETED').length,
    }));

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    return this.getServiceWithProgress(id);
  }

  async update(id: string, updateDto: UpdateServiceDto, userId?: string) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const updated = await this.prisma.service.update({
      where: { id },
      data: { ...updateDto, updatedBy: userId },
    });

    await this.createAuditLog(service, updated, 'UPDATE', 'service', id, userId);
    this.logger.log(`Servicio actualizado: ${updated.name}`, 'ServicesService');
    return this.getServiceWithProgress(id);
  }

  async remove(id: string, userId?: string) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    await this.prisma.serviceTask.updateMany({
      where: { serviceId: id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.createAuditLog(service, undefined, 'DELETE', 'service', id, userId);
    this.logger.log(`Servicio eliminado (soft): ${service.name}`, 'ServicesService');
    return { message: 'Servicio eliminado correctamente' };
  }

  async updateTaskStatus(serviceId: string, updateDto: UpdateTaskStatusDto, userId?: string) {
    const task = await this.prisma.serviceTask.findFirst({
      where: { id: updateDto.taskId, serviceId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    const updated = await this.prisma.serviceTask.update({
      where: { id: updateDto.taskId },
      data: { status: updateDto.status },
    });

    this.logger.log(`Tarea ${updateDto.taskId} actualizada a ${updateDto.status}`, 'ServicesService');
    return updated;
  }

  private async getServiceWithProgress(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        workCenter: { select: { id: true, name: true } },
        tasks: {
          where: { deletedAt: null },
          orderBy: [{ dayIndex: 'asc' }, { taskIndex: 'asc' }],
        },
      },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const tasks = service.tasks || [];
    return {
      ...service,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
    };
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
