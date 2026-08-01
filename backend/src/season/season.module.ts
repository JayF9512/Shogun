import { Module } from '@nestjs/common';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { SeasonPassController } from './season-pass.controller';
import { SeasonPassService } from './season-pass.service';

@Module({
  controllers: [SeasonController, SeasonPassController],
  providers: [SeasonService, SeasonPassService],
  exports: [SeasonService, SeasonPassService],
})
export class SeasonModule {}
