import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: any) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: payload.sub },
    });

    if (!authUser || authUser.deletedAt) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      uid: authUser.id,
      email: authUser.email,
      fullName: authUser.fullName,
      username: authUser.username,
      role: { name: authUser.role },
      status: authUser.status,
    };
  }
}
