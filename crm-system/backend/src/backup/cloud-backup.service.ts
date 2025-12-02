import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

@Injectable()
export class CloudBackupService {
  private readonly backupPath = '/app/crm_export';
  private readonly uploadsPath = '/app/uploads';

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  // כל יום בחצות (00:00)
  //@Cron('0 0 * * *')
  async createDailyBackup() {
    console.log('🚀 Starting daily backup at midnight...');
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `crm-daily-backup-${timestamp}.zip`;
      const backupFilePath = path.join(this.backupPath, backupFileName);

      // יצירת קובץ ZIP
      await this.createZipBackup(backupFilePath);

      // כאן תוכל להוסיף העלאה לגוגל דרייב או דרופבוקס
      // await this.uploadToCloud(backupFilePath);

      console.log(`✅ Daily backup completed successfully: ${backupFileName}`);
      console.log(`💾 Backup saved to: ${this.backupPath}`);
      
      // מחיקת גיבויים ישנים (שמור רק 7 ימים)
      await this.cleanOldBackups();
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
    }
  }

  private async createZipBackup(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`📦 Archive created: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      // הוספת תיקיות לגיבוי
      if (fs.existsSync(this.uploadsPath)) {
        archive.directory(this.uploadsPath, 'uploads');
      }

      if (fs.existsSync(this.backupPath)) {
        // הוספת קבצי CSV ומסמכים אבל לא גיבויי ZIP ישנים
        const files = fs.readdirSync(this.backupPath);
        files.forEach(file => {
          if (!file.endsWith('.zip')) {
            const filePath = path.join(this.backupPath, file);
            if (fs.statSync(filePath).isFile()) {
              archive.file(filePath, { name: `export/${file}` });
            } else if (fs.statSync(filePath).isDirectory()) {
              archive.directory(filePath, `export/${file}`);
            }
          }
        });
      }

      archive.finalize();
    });
  }

  private async cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupPath);
      const backupFiles = files
        .filter(file => (file.startsWith('crm-backup-') || file.startsWith('crm-daily-backup-')) && file.endsWith('.zip'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          stats: fs.statSync(path.join(this.backupPath, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // שמור רק את 7 הגיבויים החדשים ביותר (שבוע)
      if (backupFiles.length > 7) {
        const filesToDelete = backupFiles.slice(7);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Deleted old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  // פונקציה ידנית ליצירת גיבוי מיידי מסודר
  async createManualBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `crm-manual-backup-${timestamp}.zip`;
    const backupFilePath = path.join(this.backupPath, backupFileName);
    const organizedBackupPath = path.join(this.backupPath, 'organized_backup');

    // יצירת גיבוי מסודר
    await this.createOrganizedBackup(organizedBackupPath);
    
    // יצירת ZIP של הגיבוי המסודר
    await this.createZipBackup(backupFilePath);
    
    return backupFileName;
  }

  // יצירת גיבוי מסודר לפי ערים ולקוחות
  private async createOrganizedBackup(outputPath: string): Promise<void> {
    try {
      // מחיקת תיקייה קיימת אם יש
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true });
      }
      
      // יצירת תיקיית הגיבוי המסודר
      fs.mkdirSync(outputPath, { recursive: true });

      // קבלת כל הפרויקטים
      const projects = await this.projectRepository.find();
      console.log(`📂 Processing ${projects.length} projects for organized backup...`);

      // יצירת קובץ CSV עם כל הנתונים
      await this.createAllDataCSV(path.join(outputPath, 'כל_הנתונים.csv'));
      
      // יצירת קובץ CSV מפורט עם פרטי פרויקטים
      await this.createDetailedProjectsCSV(outputPath, projects);

      // ארגון הפרויקטים לפי ערים
      const projectsByCity = new Map<string, Project[]>();
      
      for (const project of projects) {
        const city = project.location || 'ללא_עיר';
        if (!projectsByCity.has(city)) {
          projectsByCity.set(city, []);
        }
        projectsByCity.get(city)!.push(project);
      }

      // יצירת תיקיות לפי ערים
      for (const [city, cityProjects] of projectsByCity) {
        const cityPath = path.join(outputPath, this.sanitizeFileName(city));
        fs.mkdirSync(cityPath, { recursive: true });

        console.log(`🏙️ Processing city: ${city} with ${cityProjects.length} projects`);

        for (const project of cityProjects) {
          await this.createProjectFolder(cityPath, project);
        }
      }

      console.log('✅ Organized backup structure created successfully');
    } catch (error) {
      console.error('❌ Error creating organized backup:', error);
      throw error;
    }
  }

  // יצירת תיקייה לפרויקט ספציפי
  private async createProjectFolder(cityPath: string, project: Project): Promise<void> {
    try {
      const projectName = `${project.id} - ${project.clientName}`;
      const projectPath = path.join(cityPath, this.sanitizeFileName(projectName));
      
      fs.mkdirSync(projectPath, { recursive: true });

      // יצירת קובץ פרטי הפרויקט
      const projectInfo = {
        'מזהה פרויקט': project.id,
        'שם לקוח': project.clientName,
        'תיאור': project.description,
        'סטטוס': project.status,
        'עיר': project.location,
        'רחוב': project.street || '',
        'מספר בית': project.buildingNumber || '',
        'מחוז': project.district,
        'טלפון': project.phoneNumber || '',
        'מחיר כולל': project.totalPrice,
        'ארכיון': project.isArchived ? 'כן' : 'לא',
        'תאריך יצירה': project.createdAt,
        'תאריך עדכון': project.updatedAt
      };

      const projectInfoContent = Object.entries(projectInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      fs.writeFileSync(
        path.join(projectPath, 'פרטי_פרויקט.txt'), 
        '\ufeff' + projectInfoContent, 
        'utf8'
      );

      // קבלת תשלומים
      const payments = await this.paymentRepository.find({ where: { projectId: project.id } });
      if (payments.length > 0) {
        const paymentsCSV = this.createPaymentsCSV(payments);
        fs.writeFileSync(
          path.join(projectPath, 'תשלומים.csv'),
          '\ufeff' + paymentsCSV,
          'utf8'
        );
      }

      // קבלת הוצאות
      const expenses = await this.expenseRepository.find({ where: { projectId: project.id } });
      if (expenses.length > 0) {
        const expensesCSV = this.createExpensesCSV(expenses);
        fs.writeFileSync(
          path.join(projectPath, 'הוצאות.csv'),
          '\ufeff' + expensesCSV,
          'utf8'
        );
      }

      // העתקת כל הקבצים המצורפים לפרויקט
      await this.copyProjectAttachments(project, projectPath);

    } catch (error) {
      console.error(`❌ Error creating folder for project ${project.id}:`, error);
    }
  }

  // יצירת CSV עם כל הנתונים
  private async createAllDataCSV(outputPath: string): Promise<void> {
    try {
      const projects = await this.projectRepository.find();
      const payments = await this.paymentRepository.find({ relations: ['project'] });
      const expenses = await this.expenseRepository.find({ relations: ['project'] });

      let csvContent = 'סוג,מזהה פרויקט,שם לקוח,עיר,תיאור,תאריך,סכום,הערות\n';

      // הוספת תשלומים
      for (const payment of payments) {
        csvContent += `תשלום,${payment.projectId},"${payment.project?.clientName || 'לא ידוע'}","${payment.project?.location || 'לא ידוע'}","${payment.project?.description || 'לא ידוע'}","${payment.date.toLocaleDateString('he-IL')}",${payment.amount},"${payment.note || ''}"\n`;
      }

      // הוספת הוצאות
      for (const expense of expenses) {
        csvContent += `הוצאה,${expense.projectId},"${expense.project?.clientName || 'לא ידוע'}","${expense.project?.location || 'לא ידוע'}","${expense.description}","${expense.date.toLocaleDateString('he-IL')}",${expense.amount},"${expense.category || ''}"\n`;
      }

      fs.writeFileSync(outputPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 All data CSV created successfully');
    } catch (error) {
      console.error('❌ Error creating all data CSV:', error);
    }
  }

  // יצירת CSV תשלומים
  private createPaymentsCSV(payments: Payment[]): string {
    let csv = 'תאריך,סכום,הערות\n';
    for (const payment of payments) {
      csv += `"${payment.date.toLocaleDateString('he-IL')}",${payment.amount},"${payment.note || ''}"\n`;
    }
    return csv;
  }

  // יצירת CSV הוצאות
  private createExpensesCSV(expenses: Expense[]): string {
    let csv = 'תאריך,סכום,תיאור,קטגוריה\n';
    for (const expense of expenses) {
      csv += `"${expense.date.toLocaleDateString('he-IL')}",${expense.amount},"${expense.description}","${expense.category || ''}"\n`;
    }
    return csv;
  }

  // יצירת CSV מפורט עם פרטי פרויקטים (כמו בפונקציית exportToCsv)
  private async createDetailedProjectsCSV(outputPath: string, projects: Project[]): Promise<void> {
    try {
      console.log('📊 Creating detailed projects CSV...');
      
      // חישוב totalPaid לכל פרויקט (כמו ב-projects.service)
      const projectsWithPaid = await Promise.all(projects.map(async (project) => {
        const payments = await this.paymentRepository.find({ where: { projectId: project.id } });
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        return { ...project, totalPaid };
      }));
      
      // מיפוי הנתונים לעברית עבור האקסל
      const flatData = projectsWithPaid.map(p => ({
        'מזהה מערכת': p.id,
        'שם הלקוח': p.clientName,
        'תיאור': p.description,
        'סטטוס': p.status === 'Pre-Work' ? 'טרם הוחל' : 
                   p.status === 'Proposal Sent' ? 'נשלחה הצעה' :
                   p.status === 'In-Progress' ? 'בביצוע' : 'הסתיים',
        'עיר': p.location,
        'כתובת מלאה': `${p.street || ''} ${p.buildingNumber || ''}`,
        'מחוז': p.district,
        'טלפון': p.phoneNumber,
        'סכום עסקה': p.totalPrice,
        'שולם עד כה': p.totalPaid,
        'יתרה לתשלום': p.totalPrice - p.totalPaid,
        'תאריך יצירה': p.createdAt ? new Date(p.createdAt).toLocaleDateString('he-IL') : '',
        'עדכון אחרון': p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('he-IL') : '',
      }));

      // withBOM: true -> זה הקסם שגורם לאקסל להבין עברית!
      const Parser = require('json2csv').Parser;
      const parser = new Parser({ withBOM: true });
      const csvContent = parser.parse(flatData);
      
      fs.writeFileSync(path.join(outputPath, 'דוח_פרויקטים_מפורט.csv'), csvContent, 'utf8');
      console.log('✅ Detailed projects CSV created successfully');
    } catch (error) {
      console.error('❌ Error creating detailed projects CSV:', error);
    }
  }

  // העתקת קבצים מצורפים לפרויקט
  private async copyProjectAttachments(project: Project, projectPath: string): Promise<void> {
    try {
      // קבלת רשימת הקבצים המצורפים מהמסד נתונים
      const attachments = await this.attachmentRepository.find({ where: { projectId: project.id } });
      
      if (attachments.length > 0) {
        const attachmentsPath = path.join(projectPath, 'קבצים_מצורפים');
        fs.mkdirSync(attachmentsPath, { recursive: true });
        
        console.log(`📎 Copying ${attachments.length} attachments for project ${project.id}`);
        
        for (const attachment of attachments) {
          try {
            const sourcePath = path.join(this.uploadsPath, attachment.filename);
            const destPath = path.join(attachmentsPath, attachment.originalName);
            
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destPath);
              console.log(`  ✅ Copied: ${attachment.originalName}`);
            } else {
              console.log(`  ⚠️ Missing file: ${attachment.filename}`);
            }
          } catch (fileError) {
            console.error(`  ❌ Error copying ${attachment.originalName}:`, fileError.message);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error copying attachments for project ${project.id}:`, error);
    }
  }

  // ניקוי שמות קבצים מתווים לא חוקיים
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // החלפת תווים לא חוקיים
      .replace(/\s+/g, '_')          // החלפת רווחים בקו תחתון
      .substring(0, 100);            // הגבלת אורך
  }

  // לעתיד: העלאה לגוגל דרייב
  // private async uploadToGoogleDrive(filePath: string) {
  //   // כאן תוכל להוסיף קוד להעלאה לגוגל דרייב
  //   // באמצעות Google Drive API
  // }
}