import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedRootUser();
    await this.seedDefaultPermissions();
  }

  private async seedRoles() {
    const roles = [
      { name: 'ROOT', level: 'ROOT' as const, description: 'Super administrator with full access' },
      {
        name: 'ADMIN',
        level: 'ADMIN' as const,
        description: 'Administrator with broad permissions',
      },
      { name: 'MANAGER', level: 'MANAGER' as const, description: 'Manager with team oversight' },
      { name: 'USER', level: 'USER' as const, description: 'Standard user with basic access' },
    ];

    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }
  }

  private async seedRootUser() {
    const existingRoot = await this.prisma.user.findUnique({
      where: { userId: '11111' },
    });

    if (!existingRoot) {
      const rootRole = await this.prisma.role.findUnique({
        where: { name: 'ROOT' },
      });

      const hashedPassword = await bcrypt.hash('root', 10);

      await this.prisma.user.create({
        data: {
          userId: '11111',
          username: 'root',
          email: 'root@localhost',
          password: hashedPassword,
          roleId: rootRole!.id,
          isActive: true,
        },
      });
    }
  }

  private async seedDefaultPermissions() {
    const permissions = [
      { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
      { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
      { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'audit:read', description: 'View audit logs', resource: 'audit', action: 'read' },
    ];

    for (const perm of permissions) {
      await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
    }

    const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const permissionsList = await this.prisma.permission.findMany();

    if (adminRole) {
      await this.prisma.role.update({
        where: { id: adminRole.id },
        data: { permissions: { connect: permissionsList.map((p) => ({ id: p.id })) } },
      });
    }
  }
}
