import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { LoggingModule } from './common/interceptors/logging.module';
import { SeedsService } from './modules/auth/seeds.service';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    AuditModule,
  ],
  providers: [SeedsService],
})
export class AppModule {}