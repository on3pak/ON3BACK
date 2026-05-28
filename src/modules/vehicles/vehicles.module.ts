import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, IdGeneratorService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
