import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/modules/users/users.service';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { CustomLogger } from '../src/common/interfaces/custom-logger.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let logger: any;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

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
    logger = module.get<CustomLogger>(CustomLogger);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if username or email exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: '1', username: 'test' });

      await expect(
        service.create({
          username: 'test',
          email: 'test@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
    });

    it('should create user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'USER' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        username: 'newuser',
        email: 'new@test.com',
        role: { id: 'role-1', name: 'USER', level: 'USER' },
      });

      const result = await service.create({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('newuser');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        role: { id: 'role-1', name: 'USER', level: 'USER' },
      });

      const result = await service.findOne('user-1');
      expect(result.username).toBe('testuser');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { username: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'oldname',
        email: 'old@test.com',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        username: 'newname',
        role: { id: 'role-1', name: 'USER', level: 'USER' },
      });

      const result = await service.update('user-1', { username: 'newname' });
      expect(result.username).toBe('newname');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-1' });

      const result = await service.remove('user-1');
      expect(result.message).toBe('User deleted successfully');
    });
  });
});