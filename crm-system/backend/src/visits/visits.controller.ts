import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() createVisitDto: any) {
    return this.visitsService.create(createVisitDto);
  }

  // הוסף בתוך המחלקה
@Get('upcoming')
findUpcoming() {
  return this.visitsService.findUpcoming();
}

  @Get('project/:id')
  findAllByProject(@Param('id') id: string) {
    return this.visitsService.findAllByProject(+id);
  }
}