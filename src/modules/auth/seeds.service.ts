import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedTestUsers();
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

  private async seedTestUsers() {
    const testUsers = [
      { email: '000001@on3.com', username: 'javier_martinez', fullName: 'Javier Martínez López', password: 'root', role: 'ROOT' as const },
      { email: '000002@on3.com', username: 'ana_garcia', fullName: 'Ana García Rodríguez', password: 'admin', role: 'ADMIN' as const },
      { email: '000003@on3.com', username: 'carlos_hernandez', fullName: 'Carlos Hernández Torres', password: 'manager', role: 'MANAGER' as const },
      { email: '000004@on3.com', username: 'laura_perez', fullName: 'Laura Pérez Sánchez', password: 'user', role: 'USER' as const },
    ];

    for (const u of testUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await this.prisma.authUser.upsert({
        where: { email: u.email },
        update: {
          username: u.username,
          fullName: u.fullName,
          password: hashedPassword,
          role: u.role,
          status: 'OFFLINE',
          language: 'ES',
        },
        create: {
          email: u.email,
          username: u.username,
          fullName: u.fullName,
          password: hashedPassword,
          role: u.role,
          status: 'OFFLINE',
          language: 'ES',
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
