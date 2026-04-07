import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private logger: CustomLogger,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByUserId(loginDto.userId);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);
    await this.revokeAllUserRefreshTokens(user.id);

    const tokens = await this.generateTokens(user);
    await this.createRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${user.username}`, 'AuthService');

    return {
      ...tokens,
      user: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userId: registerDto.userId },
          { username: registerDto.username },
          { email: registerDto.email },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('UserId, username or email already exists');
    }

    const defaultRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
    if (!defaultRole) {
      throw new BadRequestException('Default role not found');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        userId: registerDto.userId,
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        roleId: defaultRole.id,
        isActive: true,
      },
      include: { role: true },
    });

    const tokens = await this.generateTokens(user);
    await this.createRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.username}`, 'AuthService');

    return {
      ...tokens,
      user: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      await this.revokeAllUserRefreshTokens(storedToken.userId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const inactivityDays = this.configService.get<number>('jwt.refreshInactivityDays') || 30;
    const lastUsed = storedToken.lastUsedAt || storedToken.createdAt;
    const daysSinceLastUse = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUse > inactivityDays) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      await this.revokeAllUserRefreshTokens(storedToken.userId);
      throw new UnauthorizedException('Refresh token revoked due to inactivity');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { lastUsedAt: new Date() },
    });

    const tokens = await this.generateTokens(storedToken.user);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    await this.createRefreshToken(storedToken.userId, tokens.refreshToken);

    this.logger.log(`Tokens refreshed for user: ${storedToken.user.username}`, 'AuthService');

    return {
      ...tokens,
      user: {
        id: storedToken.user.id,
        userId: storedToken.user.userId,
        username: storedToken.user.username,
        email: storedToken.user.email,
        role: storedToken.user.role.name,
      },
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (userId) {
      await this.revokeAllUserRefreshTokens(userId);
      this.logger.log(`User logged out: ${userId}`, 'AuthService');
    }
  }

  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      userId: user.userId,
      username: user.username,
      role: user.role.name,
      roleId: user.role.id,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: expiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string, token: string): Promise<void> {
    const expiresInDays = parseInt(
      this.configService.get<string>('jwt.refreshExpiresIn')?.replace('d', '') || '7',
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }
}
