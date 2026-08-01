import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TutorialService } from './tutorial.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompleteStepDto } from './dto/tutorial.dto';

/** Onboarding tutorial endpoints (spec: Stage 1 tutorial system). */
@Controller('tutorial')
export class TutorialController {
  constructor(private readonly service: TutorialService) {}

  /** Static step catalogue (steps 0-12). Public so the client can preview. */
  @Get('steps')
  steps() {
    return this.service.steps();
  }

  /** The authenticated player's tutorial progress. */
  @Get('progress')
  @UseGuards(JwtAuthGuard)
  progress(@Req() req: any) {
    return this.service.getProgress(req.user.accountId);
  }

  /** Mark a tutorial step complete (awards resources + unlocks features). */
  @Post('complete-step')
  @UseGuards(JwtAuthGuard)
  completeStep(@Req() req: any, @Body() body: CompleteStepDto) {
    return this.service.completeStep(req.user.accountId, body.step, body.data);
  }
}
