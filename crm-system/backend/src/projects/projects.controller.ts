import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './project.entity';
import { Res } from '@nestjs/common'; 
import type{ Response } from 'express';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() projectData: Partial<Project>) {
    return this.projectsService.create(projectData);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: ProjectStatus }) {
    return this.projectsService.update(+id, { status: body.status });
  }
  @Patch(':id/archive')
  toggleArchive(@Param('id') id: string) {
    return this.projectsService.toggleArchive(+id);
  }
// הוסף את זה בתוך ProjectsController
  @Patch('update-vat')
  updateVatPercentage(@Body() body: { vatPercentage: number }) {
    return this.projectsService.updateVatForAllProjects(body.vatPercentage);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.update(+id, body);
  }
  @Post(':id/generate-proposal')
  async generateProposal(@Param('id') id: string) {
    return this.projectsService.generateProposal(+id);
  }

  @Get('proposal-template')
  async getProposalTemplate() {
    return this.projectsService.getProposalTemplate();
  }

  @Post('proposal-template')
  async updateProposalTemplate(@Body() body: { template: string }) {
    return this.projectsService.updateProposalTemplate(body.template);
  }

  @Get(':id/proposal-content')
  async getProposalContent(@Param('id') id: string) {
    return this.projectsService.getProposalContent(+id);
  }

  @Post(':id/update-proposal')
  async updateProposalContent(@Param('id') id: string, @Body() body: { content: string }) {
    return this.projectsService.updateProposalContent(+id, body.content);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }

  // הוסף את זה בתוך ProjectsController
  @Post('seed-data')
  seedData() {
    return this.projectsService.seed();
  }

  @Get('export/csv')
async exportCsv(@Res() res: Response) {
  const csv = await this.projectsService.exportToCsv();
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename=projects_export.csv');
  res.send(csv); // ישירות שולח את הקובץ לדפדפן
}
@Post('sync')
syncNow() {
  return this.projectsService.syncToLocalFolder();
}
}