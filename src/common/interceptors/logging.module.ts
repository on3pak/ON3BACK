import { Module, Global } from '@nestjs/common';
import { CustomLogger } from '../interfaces/custom-logger.service';

@Global()
@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggingModule {}