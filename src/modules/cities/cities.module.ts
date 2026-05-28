import { Module } from '@nestjs/common';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [CitiesController],
  providers: [CitiesService, IdGeneratorService],
  exports: [CitiesService],
})
export class CitiesModule {}
