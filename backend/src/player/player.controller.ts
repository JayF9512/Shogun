import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('players')
export class PlayerController {
  constructor(private readonly service: PlayerService) {}

  @Get()
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.service.findAll(take ? +take : 50, skip ? +skip : 0);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
