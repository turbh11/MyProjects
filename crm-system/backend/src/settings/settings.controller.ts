import { Controller, Get, Body, Put, Param, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // שליפת הגדרה ספציפית (למשל: sync_time או proposal_template)
  @Get(':key')
  async getOne(@Param('key') key: string) {
    const setting = await this.settingsService.findOne(key);
    return setting || { key, value: '' };
  }

  // שמירת הגדרה כללית
  @Post()
  async saveSetting(@Body() body: { key: string; value: string }) {
    return this.settingsService.save(body.key, body.value);
  }

  // תמיכה לאחור בפונקציות הישנות (כדי לא לשבור את מה שכבר קיים)
  @Get('template')
  getTemplate() { return this.settingsService.getTemplate(); }

  @Put('template')
  updateTemplate(@Body('value') value: string) {
    return this.settingsService.save('proposal_template', value);
  }

  @Get('engineer-info')
  async getEngineerInfo() {
    return this.settingsService.getEngineerInfo();
  }

  @Put('engineer-info')
  async updateEngineerInfo(@Body() engineerInfo: { name: string, email: string, phone: string }) {
    return this.settingsService.updateEngineerInfo(engineerInfo);
  }

  @Post('reset-template')
  async resetTemplate() {
    return this.settingsService.resetTemplateToDefault();
  }
}