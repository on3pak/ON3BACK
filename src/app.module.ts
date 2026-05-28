import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { LoggingModule } from './common/interceptors/logging.module';
import { SeedsService } from './modules/auth/seeds.service';
import { CitiesModule } from './modules/cities/cities.module';
import { WorkCentersModule } from './modules/work-centers/work-centers.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServicesModule } from './modules/services/services.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    AuditModule,
    CitiesModule,
    WorkCentersModule,
    EmployeesModule,
    VehiclesModule,
    ServicesModule,
    InventoryModule,
    LookupsModule,
    DashboardModule,
  ],
  providers: [SeedsService],
})
export class AppModule {}
