import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { IdGeneratorService } from '../../common/services/id-generator.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, IdGeneratorService],
  exports: [InventoryService],
})
export class InventoryModule {}
