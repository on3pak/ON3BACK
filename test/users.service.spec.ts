import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/modules/users/users.service';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { CustomLogger } from '../src/common/interfaces/custom-logger.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    authUser: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ employeeId: 'emp_000001' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp_000001', deletedAt: null },
      });
    });

    it('should throw ConflictException if employee already has user', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp_000001',
        userId: 'existing-user-id',
        email: '000001@on3.com',
        name: 'Test',
        lastName1: 'User',
        cityId: 'city-1',
      });

      await expect(
        service.create({ employeeId: 'emp_000001' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user successfully', async () => {
      const mockEmployee = {
        id: 'emp_000001',
        userId: null,
        email: '000001@on3.com',
        name: 'Javier',
        lastName1: 'Martínez',
        lastName2: 'López',
        cityId: 'city-1',
      };

      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'USER' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        employeeId: 'emp_000001',
        username: 'javier.martinez',
        email: '000001@on3.com',
        fullName: 'Javier Martínez López',
        role: { id: 'role-1', name: 'USER', level: 'USER' },
        status: 'ACTIVE',
        cityId: 'city-1',
      });

      const result = await service.create({ employeeId: 'emp_000001' });

      expect(result).toBeDefined();
      expect(result.username).toBe('javier.martinez');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp_000001' },
        data: { userId: 'user-1' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        role: { id: 'role-1', name: 'USER', level: 'USER' },
        employee: { id: 'emp_000001' },
        city: { id: 'city-1', name: 'Test' },
      });

      const result = await service.findOne('user-1');
      expect(result.username).toBe('testuser');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.update('id', { username: 'new' })).rejects.toThrow(NotFoundException);
    });

    it('should update user successfully', async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce({ id: 'user-1', username: 'oldname', email: 'old@test.com' })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1', username: 'newname', role: { id: 'role-1', name: 'USER' },
      });

      const result = await service.update('user-1', { username: 'newname' });
      expect(result.username).toBe('newname');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('id')).rejects.toThrow(NotFoundException);
    });

    it('should soft-delete user and authUser', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      mockPrisma.authUser.findFirst.mockResolvedValue({ id: 'auth-1', email: 'test@test.com' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.remove('user-1');

      expect(result.message).toBe('Usuario eliminado correctamente');
      expect(mockPrisma.authUser.update).toHaveBeenCalled();
    });
  });
});
