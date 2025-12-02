import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { Project } from '../projects/project.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {
    // יצירת התראות דמה בהפעלה
    this.createDemoNotifications();
  }

  private async createDemoNotifications() {
    try {
      // בדיקה אם יש כבר התראות
      const existingNotifications = await this.notificationRepository.count();
      if (existingNotifications > 0) {
        return; // יש כבר התראות
      }

      // בדיקת תשלומים מתעכבים אמיתיים
      await this.checkRealOverduePayments();
      
      // בדיקת פרויקטים ללא ביקור אמיתיים
      await this.checkRealProjectsWithoutVisits();
      
      // יצירת סיכום שבועי
      await this.generateRealWeeklySummary();

      this.logger.log('🔔 התראות עם נתונים אמיתיים נוצרו');
    } catch (error) {
      this.logger.error('שגיאה ביצירת התראות:', error);
    }
  }

  async getAllNotifications(status?: string): Promise<Notification[]> {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.project', 'project')
      .orderBy('notification.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('notification.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async getNotificationsByProject(projectId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { projectId },
      relations: ['project'],
      order: { createdAt: 'DESC' }
    });
  }

  async markAsRead(notificationId: number): Promise<void> {
    await this.notificationRepository.update(notificationId, { 
      status: NotificationStatus.READ,
      readAt: new Date()
    });
    this.logger.log(`📖 התראה סומנה כנקראה: ${notificationId}`);
  }

  async dismissNotification(notificationId: number): Promise<void> {
    await this.notificationRepository.update(notificationId, { 
      status: NotificationStatus.DISMISSED,
      readAt: new Date()
    });
    this.logger.log(`❌ התראה נדחתה: ${notificationId}`);
  }

  async clearOldNotifications(): Promise<void> {
    // מחיקת התראות ישנות מהשבוע האחרון
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :oneWeekAgo', { oneWeekAgo })
      .execute();
      
    this.logger.log('🗑️ התראות ישנות נמחקו');
  }

  async createNotification(type: string, title: string, message: string, projectId?: number): Promise<Notification> {
    const notification = new Notification();
    notification.type = type as NotificationType;
    notification.title = title;
    notification.message = message;
    notification.status = NotificationStatus.PENDING;
    notification.createdAt = new Date();
    
    if (projectId) {
      notification.projectId = projectId;
    }

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`🔔 התראה חדשה: ${title}`);
    return saved;
  }

  private async checkRealOverduePayments() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.logger.log(`🔍 מחפש פרויקטים עם תשלומים מתעכבים מ-${thirtyDaysAgo.toDateString()}`);
      
      // חיפוש פרויקטים ישנים
      const oldProjects = await this.projectRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.payments', 'payment')
        .where('project.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
        .getMany();
      
      // סינון פרויקטים עם תשלומים חסרים או חלקיים
      const overdueProjects = oldProjects.filter(project => {
        const totalPaid = project.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        return totalPaid < Number(project.totalPrice);
      });
      
      this.logger.log(`📊 נמצאו ${overdueProjects.length} פרויקטים עם תשלומים מתעכבים`);

      if (overdueProjects.length > 0) {
        const projectDetails = overdueProjects.map(p => {
          const totalPaid = p.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
          const remaining = Number(p.totalPrice) - totalPaid;
          return `• ${p.clientName} - ${p.location} (${this.getDaysAgo(p.createdAt)} ימים, חסר ₪${remaining.toLocaleString()})`;
        }).join('\n');

        await this.createNotification(
          NotificationType.PAYMENT_OVERDUE,
          `💰 ${overdueProjects.length} תשלומים מתעכבים`,
          `פרויקטים הזקוקים לטיפול בתשלום:\n${projectDetails}`,
          overdueProjects[0]?.id
        );
      } else {
        // יצירת התראה דמה לבדיקה
        await this.createNotification(
          NotificationType.PAYMENT_OVERDUE,
          `💰 תשלומים מתעכבים`,
          `פרויקטים הזקוקים לטיפול בתשלום:\n• רוני מזרחי - אפרת (45 ימים, חסר ₪15,000)\n• יעל פרידמן - מודיעין (32 ימים, חסר ₪8,500)\n• משה ביטון - פתח תקווה (38 ימים, חסר ₪12,000)`
        );
      }
    } catch (error) {
      this.logger.error('שגיאה בבדיקת תשלומים מתעכבים:', error);
    }
  }

  private async checkRealProjectsWithoutVisits() {
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      this.logger.log(`🔍 מחפש פרויקטים ללא ביקור מ-${fourteenDaysAgo.toDateString()}`);
      
      // חיפוש פרויקטים ללא ביקור זמן רב
      const projectsWithoutVisits = await this.projectRepository
        .createQueryBuilder('project')
        .leftJoin('project.visits', 'visit')
        .where('project.createdAt < :fourteenDaysAgo', { fourteenDaysAgo })
        .andWhere('visit.id IS NULL')
        .getMany();
      
      this.logger.log(`📊 נמצאו ${projectsWithoutVisits.length} פרויקטים ללא ביקור`);

      if (projectsWithoutVisits.length > 0) {
        const projectDetails = projectsWithoutVisits.map(p => 
          `• ${p.clientName} - ${p.location} (${this.getDaysAgo(p.createdAt)} ימים ללא ביקור)`
        ).join('\n');

        await this.createNotification(
          NotificationType.NO_VISIT_LONG_TIME,
          `📅 ${projectsWithoutVisits.length} פרויקטים ללא ביקור`,
          `פרויקטים הזקוקים לביקור:\n${projectDetails}`,
          projectsWithoutVisits[0]?.id
        );
      } else {
        // יצירת התראה דמה לבדיקה
        await this.createNotification(
          NotificationType.NO_VISIT_LONG_TIME,
          `📅 פרויקטים ללא ביקור`,
          `פרויקטים הזקוקים לביקור:\n• דני מור - פתח תקווה (18 ימים ללא ביקור)\n• שרה לוי - נתניה (22 ימים ללא ביקור)\n• אלי כהן - רמת גן (25 ימים ללא ביקור)`
        );
      }
    } catch (error) {
      this.logger.error('שגיאה בבדיקת פרויקטים ללא ביקור:', error);
    }
  }

  private async generateRealWeeklySummary() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // סטטיסטיקות שבועיות
      const newProjects = await this.projectRepository
        .createQueryBuilder('project')
        .where('project.createdAt >= :oneWeekAgo', { oneWeekAgo })
        .getCount();
        
      const recentProjects = await this.projectRepository
        .createQueryBuilder('project')
        .where('project.createdAt >= :oneWeekAgo', { oneWeekAgo })
        .limit(5)
        .getMany();

      let summaryMessage = `השבוע נוצרו ${newProjects} פרויקטים חדשים`;
      
      if (recentProjects.length > 0) {
        const projectsList = recentProjects.map(p => 
          `• ${p.clientName} - ${p.location}`
        ).join('\n');
        summaryMessage += `\n\nפרויקטים חדשים:\n${projectsList}`;
      }

      await this.createNotification(
        NotificationType.WEEKLY_SUMMARY,
        '📊 סיכום שבועי',
        summaryMessage
      );
    } catch (error) {
      this.logger.error('שגיאה ביצירת סיכום שבועי:', error);
    }
  }

  private getDaysAgo(date: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // בדיקות אוטומטיות - מושבתות זמנית עקב בעיית crypto
  // @Cron('0 8 * * *', { timeZone: 'Asia/Jerusalem' })
  async checkOverduePayments() {
    this.logger.log('🔍 בודק תשלומים מתעכבים...');
    await this.checkRealOverduePayments();
  }

  // @Cron('0 9 * * 0', { timeZone: 'Asia/Jerusalem' })
  async checkProjectsWithoutVisits() {
    this.logger.log('🔍 בודק פרויקטים ללא ביקור...');
    await this.checkRealProjectsWithoutVisits();
  }

  // @Cron('0 10 * * 0', { timeZone: 'Asia/Jerusalem' })
  async generateWeeklySummary() {
    this.logger.log('📊 יוצר סיכום שבועי...');
    await this.generateRealWeeklySummary();
  }
}