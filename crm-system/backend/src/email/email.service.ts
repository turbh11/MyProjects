import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailStatus, EmailType } from './email.entity';
import { CreateEmailDto } from './dto/email.dto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
    private configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('⚠️ לא הוגדרו פרטי SMTP - שליחת מיילים תהיה במצב הדמיה');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // בדיקת חיבור
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('שגיאה בחיבור SMTP:', error);
      } else {
        this.logger.log('✅ SMTP חובר בהצלחה!');
      }
    });
  }

  async sendEmail(emailData: CreateEmailDto): Promise<{ success: boolean; message: string; id: number }> {
    const email = new Email();
    email.to = emailData.to;
    email.subject = emailData.subject;
    email.htmlContent = emailData.htmlContent;
    email.type = emailData.type || EmailType.GENERAL;
    
    if (emailData.projectId) {
      email.projectId = emailData.projectId;
    }

    try {
      // בדיקה אם יש SMTP transporter
      if (this.transporter) {
        // שליחת מייל אמיתי
        const fromEmail = this.configService.get<string>('FROM_EMAIL', 'no-reply@company.com');
        const fromName = this.configService.get<string>('FROM_NAME', 'CRM System');
        
        const mailOptions = {
          from: `"${fromName}" <${fromEmail}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.htmlContent,
        };

        await this.transporter.sendMail(mailOptions);
        
        email.status = EmailStatus.SENT;
        email.sentAt = new Date();
        this.logger.log(`📧 אימייל נשלח בהצלחה: ${email.to} - ${email.subject}`);
      } else {
        // מצב הדמיה
        email.status = EmailStatus.SENT;
        email.sentAt = new Date();
        this.logger.log(`📧 אימייל נשלח (הדמיה): ${email.to} - ${email.subject}`);
      }

      const savedEmail = await this.emailRepository.save(email);

      return {
        success: true,
        message: 'אימייל נשלח בהצלחה!',
        id: savedEmail.id
      };
    } catch (error) {
      this.logger.error('שגיאה בשליחת אימייל:', error);
      
      // שמירת האימייל כנכשל
      email.status = EmailStatus.FAILED;
      
      try {
        await this.emailRepository.save(email);
      } catch (saveError) {
        this.logger.error('שגיאה בשמירת אימייל כושל:', saveError);
      }

      return {
        success: false,
        message: 'שגיאה בשליחת אימייל',
        id: 0
      };
    }
  }

  async getAllEmails(): Promise<Email[]> {
    return this.emailRepository.find({
      relations: ['project'],
      order: { createdAt: 'DESC' }
    });
  }

  async getEmailsByProject(projectId: number): Promise<Email[]> {
    return this.emailRepository.find({
      where: { projectId },
      relations: ['project'],
      order: { createdAt: 'DESC' }
    });
  }

  async getEmailStats(projectId?: number): Promise<any> {
    const queryBuilder = this.emailRepository.createQueryBuilder('email');
    
    if (projectId) {
      queryBuilder.where('email.projectId = :projectId', { projectId });
    }

    const total = await queryBuilder.getCount();
    const sent = await queryBuilder.andWhere('email.status = :status', { status: 'sent' }).getCount();
    const opened = await queryBuilder.andWhere('email.openedAt IS NOT NULL').getCount();
    
    return {
      total,
      sent,
      opened,
      openRate: sent > 0 ? (opened / sent) * 100 : 0
    };
  }

  async trackEmailOpen(emailId: number): Promise<void> {
    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (email && !email.openedAt) {
      email.openedAt = new Date();
      email.openCount = (email.openCount || 0) + 1;
      email.status = EmailStatus.OPENED;
      await this.emailRepository.save(email);
      this.logger.log(`📖 אימייל נפתח: ${email.id}`);
    }
  }

  async trackEmailClick(emailId: number): Promise<void> {
    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (email) {
      email.clickCount = (email.clickCount || 0) + 1;
      email.status = EmailStatus.CLICKED;
      await this.emailRepository.save(email);
      this.logger.log(`🖱️ קליק באימייל: ${email.id}`);
    }
  }

  // שליחת תבניות מוכנות
  async sendProposalEmail(projectId: number, to: string): Promise<{ success: boolean; message: string }> {
    const emailData: CreateEmailDto = {
      to,
      subject: 'הצעת מחיר - פרויקט חדש',
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>הצעת מחיר</h2>
          <p>שלום רב,</p>
          <p>מצורפת הצעת המחיר עבור הפרויקט שלך.</p>
          <p>נשמח לשמוע ממך בהקדם.</p>
          <p>בברכה,<br/>צוות החברה</p>
        </div>
      `,
      type: EmailType.PROPOSAL,
      projectId
    };

    return this.sendEmail(emailData);
  }

  async sendPaymentReminderEmail(projectId: number, to: string): Promise<{ success: boolean; message: string }> {
    const emailData: CreateEmailDto = {
      to,
      subject: 'תזכורת תשלום',
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>תזכורת תשלום</h2>
          <p>שלום רב,</p>
          <p>זוהי תזכורת ידידותית לתשלום עבור הפרויקט.</p>
          <p>נשמח לקבל את התשלום בהקדם האפשרי.</p>
          <p>תודה רבה,<br/>צוות החברה</p>
        </div>
      `,
      type: EmailType.PAYMENT_REMINDER,
      projectId
    };

    return this.sendEmail(emailData);
  }

  async sendReceiptEmail(data: {
    projectId: number;
    clientEmail: string;
    receiptContent: string;
    clientName: string;
  }): Promise<{ success: boolean; message: string }> {
    const emailData: CreateEmailDto = {
      to: data.clientEmail,
      subject: `קבלה - ${data.clientName}`,
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>קבלה</h2>
          <p>שלום ${data.clientName},</p>
          <p>מצורפת הקבלה עבור העבודה שבוצעה.</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; background-color: #f9f9f9;">
            ${data.receiptContent}
          </div>
          <p>תודה על הבחירה בשירותינו!</p>
          <p>בברכה,<br/>צוות החברה</p>
        </div>
      `,
      type: EmailType.RECEIPT,
      projectId: data.projectId
    };

    return this.sendEmail(emailData);
  }

  async sendContractEmail(data: {
    projectId: number;
    clientEmail: string;
    contractContent: string;
    clientName: string;
    contractType: string;
  }): Promise<{ success: boolean; message: string }> {
    const emailData: CreateEmailDto = {
      to: data.clientEmail,
      subject: `הסכם ${data.contractType} - ${data.clientName}`,
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>הסכם ${data.contractType}</h2>
          <p>שלום ${data.clientName},</p>
          <p>מצורף ההסכם לחתימתך.</p>
          <p>אנא עיין בהסכם, חתום ושלח בחזרה.</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; background-color: #f9f9f9; white-space: pre-line;">
            ${data.contractContent}
          </div>
          <p>לשאלות ובירורים, אנא צור קשר.</p>
          <p>בברכה,<br/>צוות החברה</p>
        </div>
      `,
      type: EmailType.CONTRACT,
      projectId: data.projectId
    };

    return this.sendEmail(emailData);
  }
}