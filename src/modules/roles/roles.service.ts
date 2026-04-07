import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    const permissions = createRoleDto.permissionIds
      ? await this.prisma.permission.findMany({
          where: { id: { in: createRoleDto.permissionIds } },
        })
      : [];

    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        level: createRoleDto.level,
        description: createRoleDto.description,
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
      include: { permissions: true },
    });

    await this.createAuditLog(undefined, role, 'CREATE', 'role', role.id);
    this.logger.log(`Role created: ${role.name}`, 'RolesService');
    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { level: 'desc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true, users: { select: { id: true, username: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    let permissions = undefined;
    if (updateRoleDto.permissionIds) {
      permissions = await this.prisma.permission.findMany({
        where: { id: { in: updateRoleDto.permissionIds } },
      });
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        ...updateRoleDto,
        permissions: updateRoleDto.permissionIds
          ? { set: permissions.map((p) => ({ id: p.id })) }
          : undefined,
      },
      include: { permissions: true },
    });

    await this.createAuditLog(role, updatedRole, 'UPDATE', 'role', id);
    this.logger.log(`Role updated: ${updatedRole.name}`, 'RolesService');
    return updatedRole;
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const usersWithRole = await this.prisma.user.count({ where: { roleId: id } });
    if (usersWithRole > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }

    await this.prisma.role.delete({ where: { id } });

    await this.createAuditLog(role, undefined, 'DELETE', 'role', id);
    this.logger.log(`Role deleted: ${role.name}`, 'RolesService');
    return { message: 'Role deleted successfully' };
  }

  private async createAuditLog(oldValue: any, newValue: any, action: string, entity: string, entityId: string) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldValues: oldValue,
        newValues: newValue,
      },
    });
  }
}