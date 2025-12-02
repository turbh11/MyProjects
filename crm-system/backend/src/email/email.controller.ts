import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.emailService.sendEmail(sendEmailDto);
  }

  @Post('send-proposal/:projectId')
  async sendProposalEmail(
    @Param('projectId') projectId: string,
    @Body() body: { proposalContent: string }
  ) {
    return this.emailService.sendProposalEmail(+projectId, body.proposalContent);
  }

  @Post('send-payment-reminder/:projectId')
  async sendPaymentReminderEmail(
    @Param('projectId') projectId: string,
    @Body() body: { to: string }
  ) {
    return this.emailService.sendPaymentReminderEmail(+projectId, body.to);
  }

  @Get('track/:trackingId/:action')
  async trackEmail(
    @Param('trackingId') trackingId: string,
    @Param('action') action: 'open' | 'click',
    @Res() res: Response,
  ) {
    if (action === 'open') {
      await this.emailService.trackEmailOpen(+trackingId);
    } else if (action === 'click') {
      await this.emailService.trackEmailClick(+trackingId);
    }
    
    if (action === 'open') {
      // החזרת פיקסל שקוף (1x1 GIF)
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.end(pixel);
    } else {
      // עבור click - ניתוב לעמוד קשר
      res.redirect('tel:+972500000000'); // או כל פעולה אחרת
    }
  }

  @Get('stats')
  async getEmailStats(@Query('projectId') projectId?: string) {
    return this.emailService.getEmailStats(projectId ? +projectId : undefined);
  }

  @Get('project/:projectId')
  async getProjectEmails(@Param('projectId') projectId: string) {
    return this.emailService.getEmailsByProject(+projectId);
  }

  @Get('all')
  async getAllEmails() {
    return this.emailService.getAllEmails();
  }

  @Post('send-receipt')
  async sendReceipt(@Body() data: {
    projectId: number;
    clientEmail: string;
    receiptContent: string;
    clientName: string;
  }) {
    return this.emailService.sendReceiptEmail(data);
  }

  @Post('send-contract')
  async sendContract(@Body() data: {
    projectId: number;
    clientEmail: string;
    contractContent: string;
    clientName: string;
    contractType: string;
  }) {
    return this.emailService.sendContractEmail(data);
  }
}