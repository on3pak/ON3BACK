import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from './dto/employees.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createDto: CreateEmployeeDto, userId?: string) {
    await this.validateLookups(createDto);

    const id = await this.idGenerator.generateId('employee');
    const digits = id.replace('emp_', '');
    const email = `${digits}@on3.com`;

    const employee = await this.prisma.employee.create({
      data: {
        id,
        email,
        name: createDto.name,
        lastName1: createDto.lastName1,
        lastName2: createDto.lastName2,
        phone: createDto.phone,
        personalEmail: createDto.personalEmail,
        phoneFixed: createDto.phoneFixed,
        iban: createDto.iban,
        locker: createDto.locker,
        cityId: createDto.workCenterId ? (await this.getCityFromWorkCenter(createDto.workCenterId)) : '',
        workCenterId: createDto.workCenterId,
        workDayId: createDto.workDayId,
        categoryId: createDto.categoryId,
        statusId: createDto.statusId,
        active: true,
        shiftId: createDto.shiftId,
        schedule: createDto.schedule,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        contractTypeId: createDto.contractTypeId,
        contractStartDate: new Date(createDto.contractStartDate),
        contractEndDate: createDto.contractEndDate ? new Date(createDto.contractEndDate) : null,
        irpf: createDto.irpf || 0,
        vacationDays: createDto.vacationDays ?? 22,
        ownDays: createDto.ownDays || 0,
        accumulatedDays: createDto.accumulatedDays || 0,
        excessDays: createDto.excessDays || 0,
        vacationMonth: createDto.vacationMonth || null,
        vacationYear: createDto.vacationYear || null,
        medicalCheck: createDto.medicalCheck || false,
        worksHolidays: createDto.worksHolidays || false,
        createdBy: userId,
      },
      include: {
        city: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
        workDay: { select: { id: true, name: true } },
        contractType: { select: { id: true, name: true } },
      },
    });

    await this.createAuditLog(undefined, employee, 'CREATE', 'employee', employee.id, userId);
    this.logger.log(`Empleado creado: ${employee.name} ${employee.lastName1} (${employee.id})`, 'EmployeesService');
    return employee;
  }

  async findAll(query: EmployeeQueryDto) {
    const { search, cityId, workCenterId, statusId, categoryId, active, page = 1, pageSize = 10, sort, order } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (cityId) where.cityId = cityId;
    if (workCenterId) where.workCenterId = workCenterId;
    if (statusId) where.statusId = statusId;
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.active = active;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { lastName1: { contains: search, mode: 'insensitive' } },
        { lastName2: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          city: { select: { id: true, name: true } },
          workCenter: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
          workDay: { select: { id: true, name: true } },
          contractType: { select: { id: true, name: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        city: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
        workDay: { select: { id: true, name: true } },
        contractType: { select: { id: true, name: true } },
      },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async update(id: string, updateDto: UpdateEmployeeDto, userId?: string) {
    const employee = await this.findOne(id);

    const data: any = { ...updateDto, updatedBy: userId };
    if (updateDto.contractStartDate) data.contractStartDate = new Date(updateDto.contractStartDate);
    if (updateDto.contractEndDate !== undefined) {
      data.contractEndDate = updateDto.contractEndDate ? new Date(updateDto.contractEndDate) : null;
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        city: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
      },
    });

    await this.createAuditLog(employee, updated, 'UPDATE', 'employee', id, userId);
    this.logger.log(`Empleado actualizado: ${updated.name} ${updated.lastName1}`, 'EmployeesService');
    return updated;
  }

  async remove(id: string, userId?: string) {
    const employee = await this.findOne(id);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.prisma.vehicle.updateMany({
      where: { assignedEmployeeId: id },
      data: { assignedEmployeeId: null },
    });
    await this.prisma.inventoryItem.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: null },
    });

    await this.createAuditLog(employee, updated, 'DELETE', 'employee', id, userId);
    this.logger.log(`Empleado eliminado (soft): ${employee.name} ${employee.lastName1}`, 'EmployeesService');
    return { message: 'Empleado eliminado correctamente' };
  }

  async restore(id: string, userId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado o no eliminado');

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null, updatedBy: userId },
    });

    this.logger.log(`Empleado restaurado: ${employee.name} ${employee.lastName1}`, 'EmployeesService');
    return updated;
  }

  private async getCityFromWorkCenter(workCenterId: string): Promise<string> {
    const wc = await this.prisma.workCenter.findUnique({ where: { id: workCenterId } });
    if (!wc) throw new BadRequestException('Centro de trabajo no encontrado');
    return wc.cityId;
  }

  private async validateLookups(dto: CreateEmployeeDto) {
    const checks = [
      { id: dto.workCenterId, model: 'workCenter', label: 'Centro de trabajo' },
    ];
    for (const check of checks) {
      const exists = await (this.prisma as any)[check.model].findUnique({ where: { id: check.id } });
      if (!exists) throw new BadRequestException(`${check.label} no encontrado`);
    }
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
