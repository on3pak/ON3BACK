import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, IdGeneratorService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
