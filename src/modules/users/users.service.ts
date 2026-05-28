import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
  ) {}

  async create(createUserDto: CreateUserDto, userId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: createUserDto.employeeId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    if (employee.userId) throw new ConflictException('El empleado ya tiene un usuario asociado');

    const existingEmail = await this.prisma.user.findFirst({
      where: { email: employee.email, deletedAt: null },
    });
    if (existingEmail) throw new ConflictException('Ya existe un usuario con ese email');

    const username = this.generateUsername(employee.name, employee.lastName1);

    let roleId = createUserDto.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
      if (!defaultRole) throw new BadRequestException('Rol por defecto no encontrado');
      roleId = defaultRole.id;
    }

    const user = await this.prisma.user.create({
      data: {
        employeeId: createUserDto.employeeId,
        username,
        email: employee.email,
        fullName: `${employee.name} ${employee.lastName1} ${employee.lastName2}`.trim(),
        roleId,
        status: 'ACTIVE',
        cityId: employee.cityId,
        createdBy: userId,
      },
      include: { role: { select: { id: true, name: true, level: true } }, employee: true },
    });

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });

    await this.createAuditLog(undefined, user, 'CREATE', 'user', user.id, userId);
    this.logger.log(`Usuario creado desde empleado ${employee.id}: ${user.username}`, 'UsersService');
    return user;
  }

  async findAll(query: UserQueryDto) {
    const { search, role, status, cityId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = { name: role };
    if (status) where.status = status;
    if (cityId) where.cityId = cityId;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: { select: { id: true, name: true, level: true } },
          employee: { select: { id: true, name: true, lastName1: true, lastName2: true } },
          city: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        role: { select: { id: true, name: true, level: true } },
        employee: { select: { id: true, name: true, lastName1: true, lastName2: true, email: true } },
        city: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, reqUserId?: string) {
    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: updateUserDto.username, deletedAt: null, id: { not: id } },
      });
      if (existing) throw new ConflictException('El nombre de usuario ya existe');
    }

    const data: any = { ...updateUserDto, updatedBy: reqUserId };

    if (updateUserDto.status === 'INACTIVE') {
      const authUser = await this.prisma.authUser.findFirst({
        where: { email: user.email, deletedAt: null },
      });
      if (authUser) {
        await this.prisma.authUser.update({
          where: { id: authUser.id },
          data: { status: 'OFFLINE' },
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: { select: { id: true, name: true, level: true } } },
    });

    await this.createAuditLog(user, updated, 'UPDATE', 'user', id, reqUserId);
    this.logger.log(`Usuario actualizado: ${updated.username}`, 'UsersService');
    return updated;
  }

  async remove(id: string, reqUserId?: string) {
    const user = await this.findOne(id);

    const authUser = await this.prisma.authUser.findFirst({
      where: { email: user.email, deletedAt: null },
    });
    if (authUser) {
      await this.prisma.authUser.update({
        where: { id: authUser.id },
        data: { deletedAt: new Date(), deletedBy: reqUserId },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: reqUserId },
    });

    await this.createAuditLog(user, updated, 'DELETE', 'user', id, reqUserId);
    this.logger.log(`Usuario eliminado (soft): ${user.username}`, 'UsersService');
    return { message: 'Usuario eliminado correctamente' };
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  private generateUsername(name: string, lastName1: string): string {
    const firstName = name.toLowerCase().split(' ')[0];
    const last = lastName1.toLowerCase().replace(/[^a-z]/g, '');
    return `${firstName}.${last}`;
  }

  private async createAuditLog(oldVal: any, newVal: any, action: string, entity: string, entityId: string, userId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValues: oldVal || undefined, newValues: newVal || undefined },
    });
  }
}
