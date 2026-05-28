import { ApiProperty } from '@nestjs/swagger';

export class LookupEntity {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}
