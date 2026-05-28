import { Module } from '@nestjs/common';
import { WorkCentersController } from './work-centers.controller';
import { WorkCentersService } from './work-centers.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [WorkCentersController],
  providers: [WorkCentersService, IdGeneratorService],
  exports: [WorkCentersService],
})
export class WorkCentersModule {}
