import { Module } from '@nestjs/common';
import { MarchController } from './march.controller';
import { MarchService } from './march.service';

@Module({
  controllers: [MarchController],
  providers: [MarchService],
  exports: [MarchService],
})
export class MarchModule {}
