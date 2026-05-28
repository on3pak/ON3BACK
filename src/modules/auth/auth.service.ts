import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { CustomLogger } from '../../common/interfaces/custom-logger.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: CustomLogger,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const authUser = await this.prisma.authUser.findUnique({
      where: { email: loginDto.email },
    });

    if (!authUser || authUser.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, authUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { status: 'ONLINE' },
    });

    await this.revokeAllUserRefreshTokens(authUser.id);

    const tokens = await this.generateTokens(authUser);
    await this.createRefreshToken(authUser.id, tokens.refreshToken);

    this.logger.log(`Usuario autenticado: ${authUser.email}`, 'AuthService');

    return {
      ...tokens,
      user: {
        uid: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        username: authUser.username,
        role: authUser.role,
        status: 'ONLINE',
        language: authUser.language,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.authUser.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new BadRequestException('El email ya está registrado');
      }
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const authUser = await this.prisma.authUser.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        fullName: registerDto.fullName,
        password: hashedPassword,
        role: 'USER',
        status: 'ONLINE',
        language: registerDto.language || 'ES',
      },
    });

    const tokens = await this.generateTokens(authUser);
    await this.createRefreshToken(authUser.id, tokens.refreshToken);

    this.logger.log(`Usuario registrado: ${authUser.email}`, 'AuthService');

    return {
      ...tokens,
      user: {
        uid: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        username: authUser.username,
        role: authUser.role,
        status: 'ONLINE',
        language: authUser.language,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { authUser: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token de actualización inválido');
    }

    if (storedToken.revoked) {
      await this.revokeAllUserRefreshTokens(storedToken.authUserId);
      throw new UnauthorizedException('El token de actualización ha sido revocado');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('El token de actualización ha expirado');
    }

    const inactivityDays = this.configService.get<number>('jwt.refreshInactivityDays') || 30;
    const lastUsed = storedToken.lastUsedAt || storedToken.createdAt;
    const daysSinceLastUse = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUse > inactivityDays) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      await this.revokeAllUserRefreshTokens(storedToken.authUserId);
      throw new UnauthorizedException('Token de actualización revocado por inactividad');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { lastUsedAt: new Date() },
    });

    const tokens = await this.generateTokens(storedToken.authUser);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    await this.createRefreshToken(storedToken.authUserId, tokens.refreshToken);

    this.logger.log(`Tokens renovados para: ${storedToken.authUser.email}`, 'AuthService');

    return {
      ...tokens,
      user: {
        uid: storedToken.authUser.id,
        email: storedToken.authUser.email,
        fullName: storedToken.authUser.fullName,
        username: storedToken.authUser.username,
        role: storedToken.authUser.role,
        status: storedToken.authUser.status,
        language: storedToken.authUser.language,
      },
    };
  }

  async logout(id: string) {
    if (id) {
      await this.prisma.authUser.update({
        where: { id },
        data: { status: 'OFFLINE' },
      });
      await this.revokeAllUserRefreshTokens(id);
      this.logger.log(`Usuario desconectado: ${id}`, 'AuthService');
    }
  }

  private async generateTokens(authUser: any): Promise<{ accessToken: string; refreshToken: string }> {
    const jtiAccess = uuidv4();
    const jtiRefresh = uuidv4();

    const payload = {
      sub: authUser.id,
      email: authUser.email,
      username: authUser.username,
      fullName: authUser.fullName,
      role: authUser.role,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, jti: jtiAccess },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: expiresIn as any,
        },
      ),
      this.jwtService.signAsync(
        { ...payload, jti: jtiRefresh },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: refreshExpiresIn as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(authUserId: string, token: string): Promise<void> {
    const expiresInDays = parseInt(
      this.configService.get<string>('jwt.refreshExpiresIn')?.replace('d', '') || '7',
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token,
        authUserId,
        expiresAt,
      },
    });
  }

  private async revokeAllUserRefreshTokens(authUserId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { authUserId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }
}
