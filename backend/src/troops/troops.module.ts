import { Module } from '@nestjs/common';
import { TroopsController } from './troops.controller';
import { TroopsService } from './troops.service';

@Module({
  controllers: [TroopsController],
  providers: [TroopsService],
  exports: [TroopsService],
})
export class TroopsModule {}
