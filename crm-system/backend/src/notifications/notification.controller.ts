import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getActiveNotifications(@Query('status') status?: string) {
    return this.notificationService.getAllNotifications(status);
  }

  @Get('project/:projectId')
  async getProjectNotifications(@Param('projectId') projectId: string) {
    return this.notificationService.getNotificationsByProject(+projectId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(+id);
    return { success: true };
  }

  @Patch(':id/dismiss')
  async markAsDismissed(@Param('id') id: string) {
    await this.notificationService.dismissNotification(+id);
    return { success: true };
  }

  @Post('test/overdue-payments')
  async testOverduePayments() {
    await this.notificationService.checkOverduePayments();
    return { message: 'בדיקת תשלומים מתעכבים הופעלה' };
  }

  @Post('test/no-visits')
  async testNoVisits() {
    await this.notificationService.checkProjectsWithoutVisits();
    return { message: 'בדיקת פרויקטים ללא ביקורים הופעלה' };
  }

  @Post('test/weekly-summary')
  async testWeeklySummary() {
    await this.notificationService.generateWeeklySummary();
    return { message: 'סיכום שבועי נוצר' };
  }

  @Post('refresh')
  async refreshNotifications() {
    // ניקוי התראות ישנות ויצירת חדשות עם נתונים אמיתיים
    await this.notificationService.clearOldNotifications();
    await this.notificationService.checkOverduePayments();
    await this.notificationService.checkProjectsWithoutVisits();
    await this.notificationService.generateWeeklySummary();
    
    return { message: 'התראות עודכנו עם נתונים אמיתיים' };
  }
}