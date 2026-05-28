import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedLookups();
    await this.seedCities();
    await this.seedWorkCenters();
    await this.seedEmployees();
    await this.seedTestUsers();
    await this.seedDefaultPermissions();
  }

  private async seedRoles() {
    const roles = [
      { name: 'ROOT', level: 'ROOT' as const, description: 'Superadministrador con acceso completo' },
      { name: 'ADMIN', level: 'ADMIN' as const, description: 'Administrador con permisos amplios' },
      { name: 'MANAGER', level: 'MANAGER' as const, description: 'Gestor con supervisión de equipo' },
      { name: 'USER', level: 'USER' as const, description: 'Usuario estándar con acceso básico' },
    ];

    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }
  }

  private async seedLookups() {
    const categories = [
      { id: 'ec-1', name: 'Peón Limpieza' }, { id: 'ec-2', name: 'Peón Recogida' },
      { id: 'ec-3', name: 'Oficial' }, { id: 'ec-4', name: 'Oficial 2ª' },
      { id: 'ec-5', name: 'Mantenimiento' }, { id: 'ec-6', name: 'Mecánico' },
      { id: 'ec-7', name: 'Encargado' }, { id: 'ec-8', name: 'Encargado General' },
      { id: 'ec-9', name: 'Jefe de Servicio' }, { id: 'ec-10', name: 'Administrativo' },
    ];
    for (const item of categories) {
      await this.prisma.employeeCategory.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const statuses = [
      { id: 'es-1', name: 'Trabajando' }, { id: 'es-2', name: 'Descanso' },
      { id: 'es-3', name: 'Baja' }, { id: 'es-4', name: 'Días Propios' },
      { id: 'es-5', name: 'Días Acumulados' }, { id: 'es-6', name: 'Vacaciones' },
    ];
    for (const item of statuses) {
      await this.prisma.employeeStatus.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const workDays = [
      { id: 'wd-1', name: 'Lunes a Viernes' }, { id: 'wd-2', name: 'Fin de Semana' },
      { id: 'wd-3', name: 'Rotativo 1' }, { id: 'wd-4', name: 'Rotativo 2' },
    ];
    for (const item of workDays) {
      await this.prisma.workDay.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const shifts = [
      { id: 's-1', name: 'Mañana' }, { id: 's-2', name: 'Tarde' }, { id: 's-3', name: 'Noche' },
    ];
    for (const item of shifts) {
      await this.prisma.shift.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const contractTypes = [
      { id: 'ct-1', name: 'Indefinido' }, { id: 'ct-2', name: 'Temporal' }, { id: 'ct-3', name: 'Obra' },
    ];
    for (const item of contractTypes) {
      await this.prisma.contractType.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const vehicleTypes = [
      { id: 'vt-1', name: 'RAVO', type: 'BARREDORA' as const },
      { id: 'vt-2', name: 'Camión', type: 'CAMION' as const },
      { id: 'vt-3', name: 'Furgoneta', type: 'FURGONETA' as const },
      { id: 'vt-4', name: 'Turismo', type: 'TURISMO' as const },
      { id: 'vt-5', name: 'Porter', type: 'PORTER' as const },
    ];
    for (const item of vehicleTypes) {
      await this.prisma.vehicleTypeOption.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const invCategories = [
      { id: 'ic-1', name: 'Ropa', value: 'ropa' as const },
      { id: 'ic-2', name: 'EPIs', value: 'epi' as const },
      { id: 'ic-3', name: 'Maquinaria', value: 'maquinaria' as const },
    ];
    for (const item of invCategories) {
      await this.prisma.inventoryCategoryOption.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const subtypRopa = [
      { id: 'ist-1', category: 'ropa' as const, name: 'Pantalón' },
      { id: 'ist-2', category: 'ropa' as const, name: 'Camisa' },
      { id: 'ist-3', category: 'ropa' as const, name: 'Chaqueta' },
      { id: 'ist-4', category: 'ropa' as const, name: 'Forro' },
    ];
    const subtypEpi = [
      { id: 'ist-11', category: 'epi' as const, name: 'Casco' },
      { id: 'ist-12', category: 'epi' as const, name: 'Guantes' },
      { id: 'ist-13', category: 'epi' as const, name: 'Mascarilla' },
      { id: 'ist-14', category: 'epi' as const, name: 'Máscara' },
      { id: 'ist-15', category: 'epi' as const, name: 'Arnés' },
      { id: 'ist-16', category: 'epi' as const, name: 'Protector' },
      { id: 'ist-17', category: 'epi' as const, name: 'Gafas' },
    ];
    const subtypMaq = [
      { id: 'ist-20', category: 'maquinaria' as const, name: 'Sopladora' },
      { id: 'ist-21', category: 'maquinaria' as const, name: 'Desbrozadora' },
      { id: 'ist-22', category: 'maquinaria' as const, name: 'Cortacésped' },
      { id: 'ist-23', category: 'maquinaria' as const, name: 'Motocultor' },
      { id: 'ist-24', category: 'maquinaria' as const, name: 'Hidrolimpiadora' },
      { id: 'ist-25', category: 'maquinaria' as const, name: 'Barredora' },
      { id: 'ist-26', category: 'maquinaria' as const, name: 'Motosierra' },
      { id: 'ist-27', category: 'maquinaria' as const, name: 'Generador' },
    ];
    for (const item of [...subtypRopa, ...subtypEpi, ...subtypMaq]) {
      await this.prisma.inventorySubtype.upsert({ where: { id: item.id }, update: {}, create: item });
    }

    const invStatuses = [
      { id: 'rs-1', name: 'Disponible' }, { id: 'rs-2', name: 'Agotado' }, { id: 'rs-3', name: 'En Reposición' },
    ];
    for (const item of invStatuses) {
      await this.prisma.inventoryStatus.upsert({ where: { id: item.id }, update: {}, create: item });
    }
  }

  private async seedCities() {
    const cities = [
      { id: 'city-1', name: 'Alcalá de Henares' },
      { id: 'city-2', name: 'Guadalajara' },
    ];
    for (const city of cities) {
      await this.prisma.city.upsert({ where: { id: city.id }, update: {}, create: city });
    }
  }

  private async seedWorkCenters() {
    const wcs = [
      { id: 'wc-1', name: 'Nave Central', address: 'Polígono Industrial 1', cityId: 'city-1' },
      { id: 'wc-2', name: 'Puerta Madrid', address: 'Av. Madrid 15', cityId: 'city-2' },
    ];
    for (const wc of wcs) {
      await this.prisma.workCenter.upsert({ where: { id: wc.id }, update: {}, create: { ...wc, status: 'ACTIVE' } });
    }
  }

  private async seedEmployees() {
    const employees = [
      { id: 'emp_000001', name: 'Javier', lastName1: 'Martínez', lastName2: 'López', email: '000001@on3.com', phone: '600000001', cityId: 'city-1', workCenterId: 'wc-1', workDayId: 'wd-1', categoryId: 'ec-7', statusId: 'es-1', shiftId: 's-1', schedule: '08:00-16:00', startTime: '08:00', endTime: '16:00', contractTypeId: 'ct-1', contractStartDate: new Date('2023-01-01'), irpf: 15, vacationDays: 22, active: true, medicalCheck: true },
      { id: 'emp_000002', name: 'Ana', lastName1: 'García', lastName2: 'Rodríguez', email: '000002@on3.com', phone: '600000002', cityId: 'city-1', workCenterId: 'wc-1', workDayId: 'wd-1', categoryId: 'ec-9', statusId: 'es-1', shiftId: 's-1', schedule: '08:00-16:00', startTime: '08:00', endTime: '16:00', contractTypeId: 'ct-1', contractStartDate: new Date('2023-01-15'), irpf: 18, vacationDays: 22, active: true, medicalCheck: true },
      { id: 'emp_000003', name: 'Carlos', lastName1: 'Hernández', lastName2: 'Torres', email: '000003@on3.com', phone: '600000003', cityId: 'city-2', workCenterId: 'wc-2', workDayId: 'wd-1', categoryId: 'ec-1', statusId: 'es-1', shiftId: 's-1', schedule: '08:00-16:00', startTime: '08:00', endTime: '16:00', contractTypeId: 'ct-1', contractStartDate: new Date('2023-02-01'), irpf: 10, vacationDays: 22, active: true, medicalCheck: false },
      { id: 'emp_000004', name: 'Laura', lastName1: 'Pérez', lastName2: 'Sánchez', email: '000004@on3.com', phone: '600000004', cityId: 'city-2', workCenterId: 'wc-2', workDayId: 'wd-1', categoryId: 'ec-1', statusId: 'es-1', shiftId: 's-1', schedule: '08:00-16:00', startTime: '08:00', endTime: '16:00', contractTypeId: 'ct-1', contractStartDate: new Date('2023-02-15'), irpf: 10, vacationDays: 22, active: true, medicalCheck: false },
    ];
    for (const emp of employees) {
      const existing = await this.prisma.employee.findUnique({ where: { id: emp.id } });
      if (!existing) {
        await this.prisma.employee.create({ data: { ...emp, ownDays: 0, accumulatedDays: 0, excessDays: 0, worksHolidays: false } });
      }
    }
  }

  private async seedTestUsers() {
    const rootRole = await this.prisma.role.findUnique({ where: { name: 'ROOT' } });
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const managerRole = await this.prisma.role.findUnique({ where: { name: 'MANAGER' } });
    const userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });

    const testUsers = [
      { id: '11111111-1111-1111-1111-111111111111', employeeId: 'emp_000001', username: 'javier_martinez', fullName: 'Javier Martínez López', roleId: rootRole!.id, cityId: 'city-1', email: '000001@on3.com', authEmail: '000001@on3.com', authPassword: 'root', authRole: 'ROOT' },
      { id: '22222222-2222-2222-2222-222222222222', employeeId: 'emp_000002', username: 'ana_garcia', fullName: 'Ana García Rodríguez', roleId: adminRole!.id, cityId: 'city-1', email: '000002@on3.com', authEmail: '000002@on3.com', authPassword: 'admin', authRole: 'ADMIN' },
      { id: '33333333-3333-3333-3333-333333333333', employeeId: 'emp_000003', username: 'carlos_hernandez', fullName: 'Carlos Hernández Torres', roleId: managerRole!.id, cityId: 'city-2', email: '000003@on3.com', authEmail: '000003@on3.com', authPassword: 'manager', authRole: 'MANAGER' },
      { id: '44444444-4444-4444-4444-444444444444', employeeId: 'emp_000004', username: 'laura_perez', fullName: 'Laura Pérez Sánchez', roleId: userRole!.id, cityId: 'city-2', email: '000004@on3.com', authEmail: '000004@on3.com', authPassword: 'user', authRole: 'USER' },
    ];

    for (const u of testUsers) {
      const existingUser = await this.prisma.user.findUnique({ where: { id: u.id } });
      if (!existingUser) {
        await this.prisma.user.create({
          data: {
            id: u.id,
            employeeId: u.employeeId,
            username: u.username,
            email: u.email,
            fullName: u.fullName,
            roleId: u.roleId,
            status: 'ACTIVE',
            cityId: u.cityId,
          },
        });

        await this.prisma.employee.update({
          where: { id: u.employeeId },
          data: { userId: u.id },
        });
      }

      const hashedPassword = await bcrypt.hash(u.authPassword, 10);
      await this.prisma.authUser.upsert({
        where: { email: u.authEmail },
        update: {
          username: u.username,
          fullName: u.fullName,
          password: hashedPassword,
          role: u.authRole,
          status: 'OFFLINE',
          language: 'ES',
        },
        create: {
          email: u.authEmail,
          username: u.username,
          fullName: u.fullName,
          password: hashedPassword,
          role: u.authRole,
          status: 'OFFLINE',
          language: 'ES',
        },
      });
    }
  }

  private async seedDefaultPermissions() {
    const permissions = [
      { name: 'users:read', description: 'Ver usuarios', resource: 'users', action: 'read' },
      { name: 'users:create', description: 'Crear usuarios', resource: 'users', action: 'create' },
      { name: 'users:update', description: 'Actualizar usuarios', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete' },
      { name: 'roles:read', description: 'Ver roles', resource: 'roles', action: 'read' },
      { name: 'roles:create', description: 'Crear roles', resource: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Actualizar roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Eliminar roles', resource: 'roles', action: 'delete' },
      { name: 'audit:read', description: 'Ver registros de auditoría', resource: 'audit', action: 'read' },
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
