import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultRoleExists();
  }

  private async ensureDefaultRoleExists() {
    const defaultRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
    if (!defaultRole) {
      await this.prisma.role.create({
        data: { name: 'USER', level: 'USER', description: 'Default user role' },
      });
    }
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userId: createUserDto.userId },
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('UserId, username or email already exists');
    }

    let roleId = createUserDto.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
      if (!defaultRole) {
        throw new BadRequestException('Default role not found');
      }
      roleId = defaultRole.id;
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        userId: createUserDto.userId,
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        roleId,
        isActive: createUserDto.isActive ?? true,
      },
      include: { role: true },
    });

    await this.createAuditLog(undefined, user, 'CREATE', 'user', user.id);

    this.logger.log(`User created: ${user.username}`, 'UsersService');
    return user;
  }

  async findAll(query: UserQueryDto) {
    const { search, role, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { userId: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: { select: { id: true, name: true, level: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true, level: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.userId && updateUserDto.userId !== user.userId) {
      const existingUserId = await this.prisma.user.findFirst({
        where: { userId: updateUserDto.userId },
      });
      if (existingUserId) {
        throw new ConflictException('UserId already exists');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: updateUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: { select: { id: true, name: true, level: true } } },
    });

    await this.createAuditLog(user, updatedUser, 'UPDATE', 'user', id);

    this.logger.log(`User updated: ${updatedUser.username}`, 'UsersService');
    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });

    await this.createAuditLog(user, undefined, 'DELETE', 'user', id);

    this.logger.log(`User deleted: ${user.username}`, 'UsersService');
    return { message: 'User deleted successfully' };
  }

  async findByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  private async createAuditLog(
    oldValue: any,
    newValue: any,
    action: string,
    entity: string,
    entityId: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldValues: oldValue ? { ...oldValue, password: '[REDACTED]' } : undefined,
        newValues: newValue ? { ...newValue, password: '[REDACTED]' } : undefined,
      },
    });
  }
}
