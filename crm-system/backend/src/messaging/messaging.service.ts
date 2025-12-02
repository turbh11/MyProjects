import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly settingsService: SettingsService,
  ) {}

  async sendBulkWhatsApp(message: string, clientIds?: number[], includeAll: boolean = false) {
    try {
      let projects: Project[];
      
      if (includeAll) {
        projects = await this.projectRepo.find();
      } else if (clientIds && clientIds.length > 0) {
        projects = await this.projectRepo.findByIds(clientIds);
      } else {
        return { success: false, message: 'לא נבחרו לקוחות' };
      }

      const results: Array<{
        clientName: string;
        phoneNumber: string;
        whatsappUrl: string;
        status: string;
      }> = [];
      const engineerInfo = await this.settingsService.getEngineerInfo();

      for (const project of projects) {
        if (project.phoneNumber) {
          const personalizedMessage = message
            .replace(/\{\{clientName\}\}/g, project.clientName)
            .replace(/\{\{engineerName\}\}/g, engineerInfo.name);

          const whatsappUrl = this.generateWhatsAppUrl(project.phoneNumber, personalizedMessage);
          
          results.push({
            clientName: project.clientName,
            phoneNumber: project.phoneNumber,
            whatsappUrl,
            status: 'ready'
          });
        }
      }

      return {
        success: true,
        message: `הוכנו ${results.length} הודעות לשליחה`,
        results
      };
    } catch (error) {
      console.error('שגיאה בשליחת הודעות המוניות:', error);
      return { success: false, message: 'שגיאה בהכנת ההודעות' };
    }
  }

  async sendPaymentReminders(projectIds?: number[]) {
    try {
      let projects: Project[];
      
      if (projectIds && projectIds.length > 0) {
        projects = await this.projectRepo.findByIds(projectIds);
      } else {
        // מציאת פרויקטים עם יתרת חוב
        projects = await this.projectRepo.find();
      }

      const reminders: Array<{
        projectId: number;
        clientName: string;
        phoneNumber: string;
        remainingAmount: number;
        whatsappUrl: string;
      }> = [];
      
      for (const project of projects) {
        const payments = await this.paymentRepo.find({ where: { projectId: project.id } });
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining = Number(project.totalPrice) - totalPaid;

        if (remaining > 0 && project.phoneNumber) {
          const message = `שלום ${project.clientName}, זוהי תזכורת ידידותית שעדיין קיימת יתרת תשלום של ₪${remaining.toLocaleString()} עבור הפרויקט שלך. אשמח לتאם איתך את השלמת התשלום. תודה!`;
          
          const whatsappUrl = this.generateWhatsAppUrl(project.phoneNumber, message);
          
          reminders.push({
            projectId: project.id,
            clientName: project.clientName,
            phoneNumber: project.phoneNumber,
            remainingAmount: remaining,
            whatsappUrl
          });
        }
      }

      return {
        success: true,
        message: `נמצאו ${reminders.length} פרויקטים עם יתרת חוב`,
        reminders
      };
    } catch (error) {
      console.error('שגיאה בתזכורות תשלום:', error);
      return { success: false, message: 'שגיאה ביצירת תזכורות' };
    }
  }

  async getMessageTemplates() {
    const templates = [
      {
        name: 'הודעת ברכה',
        content: 'שלום {{clientName}}, תודה שבחרת לעבוד איתנו! נשמח לעדכן אותך על התקדמות הפרויקט. {{engineerName}}'
      },
      {
        name: 'עדכון פרויקט',
        content: 'שלום {{clientName}}, רציתי לעדכן אותך על התקדמות הפרויקט שלך. אשמח לתאם ביקור בקרוב. {{engineerName}}'
      },
      {
        name: 'תזכורת תשלום',
        content: 'שלום {{clientName}}, זוהי תזכורת ידידותית על יתרת התשלום לפרויקט. אשמח לתאום איתך. תודה! {{engineerName}}'
      },
      {
        name: 'סיום פרויקט',
        content: 'שלום {{clientName}}, שמח לעדכן שהפרויקט שלך הושלם בהצלחה! תודה על האמון. {{engineerName}}'
      }
    ];

    return templates;
  }

  async saveMessageTemplate(name: string, content: string) {
    // כאן אפשר לשמור תבניות מותאמות אישית במסד הנתונים
    return { success: true, message: 'התבנית נשמרה' };
  }

  private generateWhatsAppUrl(phoneNumber: string, message: string): string {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }
}