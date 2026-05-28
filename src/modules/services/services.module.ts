import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, IdGeneratorService],
  exports: [ServicesService],
})
export class ServicesModule {}
