import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { StatesService } from './states.service';
import { CreateStateDto, RequestMigrationDto } from './dto/states.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('states')
export class StatesController {
  constructor(private readonly service: StatesService) {}

  /** Create a state (admin only). */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateStateDto, @Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin role required');
    }
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  /** Declared before ':id' so the literal path is not captured as an id. */
  @Get('migration/available')
  @UseGuards(JwtAuthGuard)
  availableMigrations(@Req() req: any) {
    return this.service.availableMigrations(req.user.accountId);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @Req() req: any) {
    return this.service.join(req.user.accountId, id);
  }

  @Post(':id/migration/request')
  @UseGuards(JwtAuthGuard)
  requestMigration(
    @Param('id') id: string,
    @Body() dto: RequestMigrationDto,
    @Req() req: any,
  ) {
    return this.service.requestMigration(req.user.accountId, id, dto.targetStateNumber);
  }
}
