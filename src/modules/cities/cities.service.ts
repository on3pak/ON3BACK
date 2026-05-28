import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';
import { CreateCityDto, UpdateCityDto } from './dto/cities.dto';

@Injectable()
export class CitiesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(createCityDto: CreateCityDto, userId?: string) {
    const existing = await this.prisma.city.findFirst({
      where: { name: createCityDto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Ya existe una ciudad con ese nombre');

    const id = await this.idGenerator.generateId('city');
    const city = await this.prisma.city.create({
      data: {
        id,
        name: createCityDto.name,
        createdBy: userId,
      },
    });

    await this.createAuditLog(undefined, city, 'CREATE', 'city', city.id, userId);
    this.logger.log(`Ciudad creada: ${city.name} (${city.id})`, 'CitiesService');
    return city;
  }

  async findAll(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where = { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.city.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.city.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findFirst({
      where: { id, deletedAt: null },
    });
    if (!city) throw new NotFoundException('Ciudad no encontrada');
    return city;
  }

  async update(id: string, updateCityDto: UpdateCityDto, userId?: string) {
    const city = await this.findOne(id);

    if (updateCityDto.name && updateCityDto.name !== city.name) {
      const existing = await this.prisma.city.findFirst({
        where: { name: updateCityDto.name, deletedAt: null, id: { not: id } },
      });
      if (existing) throw new ConflictException('Ya existe una ciudad con ese nombre');
    }

    const updated = await this.prisma.city.update({
      where: { id },
      data: {
        ...updateCityDto,
        updatedBy: userId,
      },
    });

    await this.createAuditLog(city, updated, 'UPDATE', 'city', id, userId);
    this.logger.log(`Ciudad actualizada: ${updated.name}`, 'CitiesService');
    return updated;
  }

  async remove(id: string, userId?: string) {
    const city = await this.findOne(id);

    const hasWorkCenters = await this.prisma.workCenter.findFirst({
      where: { cityId: id, deletedAt: null },
    });
    if (hasWorkCenters) {
      throw new ConflictException('No se puede eliminar la ciudad: tiene centros de trabajo activos');
    }

    const updated = await this.prisma.city.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await this.createAuditLog(city, updated, 'DELETE', 'city', id, userId);
    this.logger.log(`Ciudad eliminada (soft): ${city.name}`, 'CitiesService');
    return { message: 'Ciudad eliminada correctamente' };
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldVal || undefined,
        newValues: newVal || undefined,
      },
    });
  }
}
