import { Controller, Post, Body, Get } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('whatsapp/bulk')
  async sendBulkWhatsApp(@Body() data: { message: string; clientIds?: number[]; includeAll?: boolean }) {
    return this.messagingService.sendBulkWhatsApp(data.message, data.clientIds, data.includeAll);
  }

  @Get('templates')
  async getMessageTemplates() {
    return this.messagingService.getMessageTemplates();
  }

  @Post('templates')
  async saveMessageTemplate(@Body() data: { name: string; content: string }) {
    return this.messagingService.saveMessageTemplate(data.name, data.content);
  }

  @Post('payment-reminders')
  async sendPaymentReminders(@Body() data: { projectIds?: number[] }) {
    return this.messagingService.sendPaymentReminders(data.projectIds);
  }
}