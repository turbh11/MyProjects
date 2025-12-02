import { Injectable, OnModuleInit } from '@nestjs/common'; // <--- הוספנו OnModuleInit
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Task, TaskPriority } from '../tasks/entities/task.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Visit } from '../visits/entities/visit.entity';
import { SettingsService } from '../settings/settings.service';
import * as fs from 'fs';
import * as path from 'path';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import * as fontkit from 'fontkit';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

@Injectable()
export class ProjectsService implements OnModuleInit {
  private lastRunDate: string = ''; // למניעת ריצה כפולה באותו יום
  constructor(
    @InjectRepository(Project) private projectsRepository: Repository<Project>,
    @InjectRepository(Attachment) private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Task) private tasksRepository: Repository<Task>,
    @InjectRepository(Payment) private paymentsRepository: Repository<Payment>,
    @InjectRepository(Visit) private visitsRepository: Repository<Visit>,
    private settingsService: SettingsService,
  ) {}

  create(createProjectDto: any) {
    const project = this.projectsRepository.create(createProjectDto);
    return this.projectsRepository.save(project);
  }

  async findAll(): Promise<any[]> {
    const projects = await this.projectsRepository.find({
      relations: ['payments'],
      order: { district: 'ASC', location: 'ASC', clientName: 'ASC' },
    });

    return projects.map(project => {
      const totalPaid = project.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const { payments, ...projectData } = project; 
      return { ...projectData, totalPaid };
    });
  }

  findOne(id: number) { return this.projectsRepository.findOneBy({ id }); }

  async update(id: number, attrs: Partial<Project>) {
    const existingProject = await this.projectsRepository.findOneBy({ id });
    if (
      existingProject &&
      (Number(existingProject.totalPrice) === 0 || existingProject.totalPrice === null) &&
      attrs.totalPrice && 
      Number(attrs.totalPrice) > 0 &&
      existingProject.status === ProjectStatus.PRE_WORK
    ) {
      attrs.status = ProjectStatus.PROPOSAL;
    }
    await this.projectsRepository.update(id, attrs);
    return this.projectsRepository.findOneBy({ id });
  }

  async updateVatForAllProjects(vatPercentage: number): Promise<{ updated: number }> {
    const result = await this.projectsRepository
      .createQueryBuilder()
      .update(Project)
      .set({ vatPercentage })
      .execute();
    
    return { updated: result.affected || 0 };
  }

  async remove(id: number) { await this.projectsRepository.delete(id); }

  async toggleArchive(id: number) {
    const project = await this.projectsRepository.findOneBy({ id });
    if (project) {
      project.isArchived = !project.isArchived;
      return this.projectsRepository.save(project);
    }
  }

  // --- SEED FUNCTION (עם טיפול בשגיאות) ---
  async seed() {
    console.log("Starting Seed process...");
    try {
        const firstNames = ['דוד', 'יעל', 'משה', 'שרה', 'יוסי', 'רחל', 'אברהם', 'נועה', 'איתי', 'רוני'];
        const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהמי', 'פרידמן'];
        const cities = ['ירושלים', 'תל אביב', 'אפרת', 'מודיעין', 'רעננה', 'פתח תקווה'];
        const streets = ['הזית', 'התמר', 'הגפן', 'הרצל', 'זבוטינסקי'];
        const districts = ['ירושלים', 'מרכז', 'גוש עציון', 'בנימין', 'דרום'];
        
        // נתיב בטוח
        const uploadDir = path.join(process.cwd(), 'uploads'); 
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (let i = 0; i < 10; i++) {
          const statusOptions = ['Pre-Work', 'Proposal Sent', 'In-Progress', 'Done'];
          const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
          const totalPrice = Math.floor(Math.random() * 80000) + 15000;
          
          const project = await this.projectsRepository.save({
            clientName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            description: 'שיפוץ כללי והרחבה',
            status: status as any,
            location: cities[Math.floor(Math.random() * cities.length)],
            street: streets[Math.floor(Math.random() * streets.length)],
            buildingNumber: Math.floor(Math.random() * 50).toString(),
            district: districts[Math.floor(Math.random() * districts.length)],
            totalPrice: totalPrice,
            phoneNumber: `05${Math.floor(Math.random() * 9)}-${Math.floor(Math.random() * 8999999 + 1000000)}`,
            createdAt: randomDate(new Date(2023, 0, 1), new Date())
          });

          // תשלומים
          if (status === 'In-Progress' || status === 'Done') {
             await this.paymentsRepository.save({
               amount: Math.floor(totalPrice * 0.3),
               note: 'מקדמה',
               date: randomDate(project.createdAt, new Date()),
               project: project,
               projectId: project.id
             });
          }

          // משימות
          await this.tasksRepository.save({
              description: 'להכין סקיצה',
              priority: TaskPriority.HIGH,
              project: project,
              projectId: project.id
          });

          // ביקורים
          await this.visitsRepository.save({
              description: 'מדידות ראשוניות',
              nextActions: 'להמשיך מעקב',
              visitDate: randomDate(new Date(), new Date(2025, 11, 31)),
              project: project,
              projectId: project.id
          });

          // קבצים
          try {
            const fname = `seed-file-${project.id}.txt`;
            const fpath = path.join(uploadDir, fname);
            fs.writeFileSync(fpath, `קובץ דמה עבור ${project.clientName}`);
            
            await this.attachmentsRepository.save({
                filename: fname,
                originalName: `מסמך אפיון.txt`,
                projectId: project.id,
                project: project
            });
          } catch(e) {
              console.error("Seed file error:", e);
          }
        }
        return { message: 'Seeding complete!' };

    } catch (error) {
        console.error("Seed Failed:", error);
        // החזרת השגיאה למשתמש כדי שנבין מה קרה
        return { message: 'Failed to seed', error: error.toString() };
    }
  }

  // --- יצירת הצעה מקצועית עם PDF ו-DOCX ---
  async generateProposal(id: number) {
    const project = await this.projectsRepository.findOneBy({ id });
    if (!project) throw new Error('Project not found');

    // שליפת פרטי המהנדס
    const engineerInfo = await this.settingsService.getEngineerInfo();

    // חישוב נתונים נוספים
    const payments = await this.paymentsRepository.find({ where: { projectId: id } });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(project.totalPrice) - totalPaid;
    const vatAmount = Number(project.totalPrice) * 0.17; // מע"מ
    const priceBeforeVat = Number(project.totalPrice) - vatAmount;

    const setting = await this.settingsService.findOne('proposal_template');
    let proposalTemplate = setting ? setting.value : this.getDefaultTemplate(engineerInfo);

    const address = `${project.street || ''} ${project.buildingNumber || ''}, ${project.location}`;
    const today = new Date().toLocaleDateString('he-IL');
    
    // החלפת משתנים בתבנית
    proposalTemplate = proposalTemplate
        .replace(/{{clientName}}/g, project.clientName)
        .replace(/{{description}}/g, project.description)
        .replace(/{{address}}/g, address)
        .replace(/{{totalPrice}}/g, Number(project.totalPrice).toLocaleString())
        .replace(/{{priceBeforeVat}}/g, priceBeforeVat.toLocaleString())
        .replace(/{{vatAmount}}/g, vatAmount.toLocaleString())
        .replace(/{{totalPaid}}/g, totalPaid.toLocaleString())
        .replace(/{{remaining}}/g, remaining.toLocaleString())
        .replace(/{{phone}}/g, project.phoneNumber || '')
        .replace(/{{date}}/g, today)
        .replace(/{{projectId}}/g, project.id.toString());

    project.proposalText = proposalTemplate;
    await this.projectsRepository.save(project);
    
    // יצירת DOCX מתבנית עם עיצוב ורקע
    await this.createDocxFromTemplate(project, proposalTemplate);
    
    // יצירת PDF
    await this.createProfessionalPdf(project, proposalTemplate);

    return project;
  }

  // תבנית ברירת מחדל מקצועית בהתבסס על הדוגמה המקצועית
  private getDefaultTemplate(engineerInfo?: { name: string, email: string, phone: string }): string {
    const name = engineerInfo?.name || 'מוטי מנחם';
    const email = engineerInfo?.email || 'Eng.motimen@gmail.com';
    const phone = engineerInfo?.phone || '052-2670274';
    return `בס"ד

${name}
הנדסה אזרחית
רחוב אבני החושן 86 גבעת זאב

{{date}}

לכבוד 
{{clientName}}

הנדון: הצעת מחיר עבור {{description}}

שלום רב,
עיינתי בתכנית האדריכלית ל{{description}}.

ההצעה כוללת:
•	חתימה על תכניות ההגשה
•	הצהרת מהנדס
•	הצהרת מהנדס על כמות פינוי פסולת 
•	הצהרת מהנדס על כמות פינוי עפר
•	עריכת חישובים סטטיים
•	עריכת תכנית עבודה לקבלן
•	ביקורים לפני יציקות, ככל שידרשו בתקופת בניית השלד

סך ההצעה לשתי היחידות, {{totalPrice}} ₪ לא כולל מע"מ
ההצעה אינה כוללת תשלום עבור יועצים אחרים (מודד, יועץ קרקע, איטום אינסטלציה וכו').

ב כ ב ו ד    ר ב,

${name}
הנדסת בניין

אימייל: ${email}
נייד: ${phone}`;
  }

  // יצירת DOCX מתבנית קיימת עם עיצוב ורקע
  private async createDocxFromTemplate(project: any, content: string) {
    try {
        // ניסיון מספר נתיבים אפשריים
        const possiblePaths = [
            path.join(__dirname, '..', '..', 'assets', 'הצעת מחיר.docx'),
            path.join(process.cwd(), 'assets', 'הצעת מחיר.docx'),
            '/app/assets/הצעת מחיר.docx'
        ];
        
        let templatePath: string | null = null;
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                templatePath = testPath;
                break;
            }
        }
        
        console.log('🔍 מחפש תבנית בנתיבים:', possiblePaths);
        console.log('📄 נתיב תבנית נמצא:', templatePath);
        
        if (templatePath && fs.existsSync(templatePath)) {
            console.log('🎨 משתמש בתבנית הקיימת');
            
            // קריאת התבנית הקיימת
            const templateBuffer = fs.readFileSync(templatePath);
            
            // יצירת מסמך מהתבנית
            const zip = new PizZip(templateBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
            
            // החלפת משתנים
            const address = `${project.street || ''} ${project.buildingNumber || ''}, ${project.location}`;
            const today = new Date().toLocaleDateString('he-IL');
            
            doc.setData({
                date: today,
                client_name: project.clientName,
                project_subject: project.description,
                price: Number(project.totalPrice).toLocaleString()
            });
            
            doc.render();
            
            // שמירת הקובץ
            const outputPath = path.join(__dirname, '..', '..', 'uploads', `הצעת מחיר (ניתן לעריכה) - ${project.clientName}.docx`);
            const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
            fs.writeFileSync(outputPath, outputBuffer);
            
            console.log(`✅ נוצר קובץ DOCX: ${outputPath}`);
            return outputPath;
        } else {
            console.log('⚠️ תבנית לא נמצאה, משתמש בפונקציה הרגילה');
            return await this.createProfessionalDocx(project, content);
        }
    } catch (error) {
        console.error('❌ שגיאה ביצירת DOCX מתבנית:', error);
        return await this.createProfessionalDocx(project, content);
    }
  }

  // יצירת DOCX מקצועי עם עיצוב מתקדם (גיבוי)
  private async createProfessionalDocx(project: any, content: string) {
    try {
        // הוספת רקע אם קיים
        let backgroundImage;
        try {
            const backgroundPath = path.join(__dirname, '..', '..', 'assets', 'background.jpg');
            if (fs.existsSync(backgroundPath)) {
                const backgroundBuffer = fs.readFileSync(backgroundPath);
                backgroundImage = {
                    data: backgroundBuffer,
                    transformation: { width: 595, height: 842 } // A4 size
                };
            }
        } catch (e) {}

        const doc = new Document({
            background: backgroundImage ? {
                color: "FFFFFF"
            } : undefined,
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1000,
                            bottom: 1000, 
                            left: 1200,
                            right: 1200,
                        },
                        pageNumbers: {
                            start: 1
                        }
                    },
                },
                children: [
                    // לוגו/כותרת עליונה
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "מוטי מנחם - הנדסה אזרחית",
                                bold: true,
                                size: 32,
                                color: "2C3E50",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),

                    // כותרת מקצועית עם מסגרת
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "הצעת מחיר מקצועית", 
                                bold: true,
                                size: 36,
                                color: "1A365D",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        border: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "3182CE" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "3182CE" }
                        },
                        spacing: { before: 200, after: 400 }
                    }),
                    
                    // תוכן מעוצב
                    ...this.formatDocxContent(content),

                    // מקום לחותמת וחתימה
                    new Paragraph({
                        text: "",
                        spacing: { before: 600, after: 200 }
                    }),
                    
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "בכבוד רב,",
                                size: 24,
                                color: "27AE60",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 150 }
                    }),
                    
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "מוטי מנחם",
                                bold: true,
                                size: 28,
                                color: "2C3E50",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "[כאן מקום לחותמת וחתימה]",
                                italics: true,
                                size: 20,
                                color: "7F8C8D",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 300 }
                    }),

                    // כותרת תחתונה
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `נוצר במערכת CRM מקצועית | ${new Date().toLocaleDateString('he-IL')}`,
                                size: 18,
                                color: "95A5A6",
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        border: {
                            top: { style: BorderStyle.SINGLE, size: 3, color: "BDC3C7" }
                        },
                        spacing: { before: 400 }
                    })
                ],
            }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        const filename = `proposal-${project.id}-${Date.now()}.docx`;
        const filePath = path.join(process.cwd(), 'uploads', filename);
        
        fs.writeFileSync(filePath, buffer);
        
        const attachment = this.attachmentsRepository.create({
            filename: filename,
            originalName: `הצעת מחיר (ניתן לעריכה) - ${project.clientName}.docx`,
            projectId: project.id,
            project: project
        });
        await this.attachmentsRepository.save(attachment);
        
        console.log(`✅ DOCX created: ${filename}`);
    } catch(e) {
        console.error("DOCX Error:", e);
    }
  }

  // פונקציה לעיצוב התוכן ב-DOCX
  private formatDocxContent(content: string): Paragraph[] {
    const lines = content.split('\n');
    const paragraphs: Paragraph[] = [];

    lines.forEach(line => {
        if (!line.trim()) {
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
            return;
        }

        let textRun: TextRun;
        let alignment = AlignmentType.RIGHT;
        let spacing = { after: 150 };

        // עיצוב מיוחד לשורות שונות
        if (line.includes('🔨') || line.includes('💰')) {
            // כותרות עם אייקונים
            textRun = new TextRun({
                text: line,
                bold: true,
                size: 28,
                color: "2563EB",
                font: "Arial"
            });
            spacing = { after: 200 };
        } else if (line.includes('לכבוד') || line.includes('שלום רב')) {
            // פתיחה
            textRun = new TextRun({
                text: line,
                size: 24,
                color: "1F2937",
                font: "Arial"
            });
        } else if (line.includes('בברכה') || line.includes('מוטי מנחם')) {
            // חתימה
            textRun = new TextRun({
                text: line,
                bold: true,
                size: 26,
                color: "059669",
                font: "Arial"
            });
        } else if (line.includes('📧') || line.includes('📱')) {
            // פרטי קשר
            textRun = new TextRun({
                text: line,
                size: 22,
                color: "6B7280",
                font: "Arial"
            });
        } else {
            // טקסט רגיל
            textRun = new TextRun({
                text: line,
                size: 24,
                color: "374151",
                font: "Arial"
            });
        }

        paragraphs.push(new Paragraph({
            children: [textRun],
            alignment,
            bidirectional: true,
            spacing
        }));
    });

    return paragraphs;
  }

  // יצירת PDF מקצועי
  private async createProfessionalPdf(project: any, content: string) {
    try {
        const doc = new PDFDocument({ 
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            info: {
                Title: `הצעת מחיר - ${project.clientName}`,
                Author: 'מערכת CRM',
                Subject: 'הצעת מחיר',
                CreationDate: new Date()
            }
        });
        
        const filename = `proposal-${project.id}-${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', filename);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        try {
            // יצירת תיקיות אם לא קיימות
            const assetsDir = path.join(__dirname, '..', '..', 'assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }
            
            // הוספת רקע אם קיים (כרקע קל)
            const backgroundPath = path.join(assetsDir, 'background.jpg');
            if (fs.existsSync(backgroundPath)) {
                doc.save();
                doc.opacity(0.1);  // שקיפות נמוכה לרקע
                doc.image(backgroundPath, 0, 0, { 
                    width: doc.page.width, 
                    height: doc.page.height
                });
                doc.restore(); // חזרה לשקיפות רגילה
            }
        } catch (e) {
            console.log('⚠️ Could not load background:', e.message);
        }
        
        // הגדרת פונט לעברית - נסה עם פונטים שונים
        try {
            // ננסה להשתמש בפונט מובנה שתומך בעברית
            doc.font('Helvetica');
            
            // PDF מוכן לעברית
        } catch (e) {
            console.log('⚠️ Font loading issue:', e.message);
            doc.font('Helvetica'); // fallback
        }
        
        // כותרת עם עיצוב משופר
        doc.fontSize(28)
           .fillColor('#1a365d')
           .text('הצעת מחיר מקצועית', 50, 60, { 
               align: 'center',
               width: 500
           });
           
        // לוגו או חותמת עליונה
        try {
            const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 450, 30, { width: 80, height: 60 });
            }
        } catch (e) {}
        
        // קו דקורטיבי
        doc.strokeColor('#3182ce')
           .lineWidth(2)
           .moveTo(50, 110)
           .lineTo(550, 110)
           .stroke();
        
        // קו הפרדה
        doc.moveTo(50, 90).lineTo(550, 90).stroke();
        
        // תוכן
        let yPosition = 120;
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (yPosition > 750) { // מעבר לעמוד חדש
                doc.addPage();
                yPosition = 50;
            }
            
            if (line.includes('═')) {
                doc.fontSize(10);
                doc.text('─'.repeat(60), 50, yPosition, { align: 'center' });
            } else if (line.includes('───')) {
                doc.fontSize(8);
                doc.text('─'.repeat(40), 50, yPosition);
            } else {
                doc.fontSize(12);
                doc.text(line, 50, yPosition, { 
                    align: 'right',
                    width: 500
                });
            }
            yPosition += 18;
        }
        
        doc.end();
        
        // המתנה לסיום כתיבת הקובץ
        await new Promise<void>((resolve) => {
            stream.on('finish', () => resolve());
        });
        
        const attachment = this.attachmentsRepository.create({
            filename: filename,
            originalName: `הצעת מחיר (PDF) - ${project.clientName}.pdf`,
            projectId: project.id,
            project: project
        });
        await this.attachmentsRepository.save(attachment);
        
        console.log(`✅ PDF created: ${filename}`);
    } catch(e) {
        console.error("PDF Error:", e);
    }
  }

  // קבלת תבנית הצעת מחיר
  async getProposalTemplate() {
    const setting = await this.settingsService.findOne('proposal_template');
    return {
      template: setting?.value || this.getDefaultTemplate(),
      variables: [
        '{{clientName}}',
        '{{description}}', 
        '{{address}}',
        '{{totalPrice}}',
        '{{priceBeforeVat}}',
        '{{vatAmount}}',
        '{{totalPaid}}',
        '{{remaining}}',
        '{{phone}}',
        '{{date}}',
        '{{projectId}}'
      ]
    };
  }

  // עדכון תבנית הצעת מחיר  
  async updateProposalTemplate(template: string) {
    await this.settingsService.save('proposal_template', template);
    return { message: 'תבנית הצעת המחיר עודכנה בהצלחה' };
  }

  // קבלת תוכן הצעת מחיר לעריכה
  async getProposalContent(projectId: number) {
    const project = await this.projectsRepository.findOneBy({ id: projectId });
    if (!project) throw new Error('Project not found');
    
    return {
      content: project.proposalText || '',
      clientName: project.clientName,
      hasProposal: !!project.proposalText
    };
  }

  // עדכון תוכן הצעת מחיר
  async updateProposalContent(projectId: number, content: string) {
    const project = await this.projectsRepository.findOneBy({ id: projectId });
    if (!project) throw new Error('Project not found');
    
    project.proposalText = content;
    await this.projectsRepository.save(project);
    
    return { 
      message: 'הצעת המחיר עודכנה בהצלחה',
      content: content 
    };
  }

  // --- סנכרון (כרגע מבוטל זמנית כדי לבדוק את ה-SEED) ---
  // @Cron(CronExpression.EVERY_1_HOUR) 
  //async syncToLocalFolder() {
    // ... הקוד הישן יכול להישאר פה, הוא פשוט לא ירוץ אוטומטית
    //return { message: 'Sync disabled temporarily' };
  //}
  // הוסף imports אלו למעלה אם חסרים:
  // import * as fs from 'fs';
  // import * as path from 'path';
  // import { Cron, CronExpression } from '@nestjs/schedule';
  // import { Parser } from 'json2csv';

  // --- סנכרון אוטומטי (רץ כל שעה) ---
  //@Cron(CronExpression.EVERY_DAY_AT_1AM) 
  // --- סנכרון למחשב (SYNC) ---
  // הורדתי את @Cron זמנית כדי שהשרת יעלה בטוח!
  // @Cron(CronExpression.EVERY_1_HOUR) 
  //@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncToLocalFolder() {
    console.log('🔄 Starting Daily Sync...');
    try {
        const internalUploads = '/app/uploads';
        const externalExport = '/app/crm_export'; // ממופה למחשב שלך

        if (!fs.existsSync(externalExport)) fs.mkdirSync(externalExport, { recursive: true });

        const projects = await this.findAll();

        // 2. יצירת קובץ אקסל מפורט (בדיוק כמו בהורדה הידנית)
        try {
            const flatData = projects.map(p => ({
                'מזהה מערכת': p.id,
                'שם הלקוח': p.clientName,
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
                'תיאור': p.description,
                'תאריך יצירה': p.createdAt ? new Date(p.createdAt).toLocaleDateString('he-IL') : '',
                'עדכון אחרון': p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('he-IL') : '',
            }));

            const parser = new Parser({ withBOM: true }); // תמיכה בעברית
            const csv = parser.parse(flatData);
            // שומרים את זה בשם ברור
            fs.writeFileSync(path.join(externalExport, 'Full_Report.csv'), csv);
        } catch(e) { console.error("CSV Error", e); }

        // 3. העתקת קבצים לתיקיות לפי ערים
        const citiesMap = new Map<string, Project[]>();
        
        // קיבוץ פרויקטים לפי ערים
        for (const p of projects) {
            const city = p.location || 'לא מוגדר';
            if (!citiesMap.has(city)) {
                citiesMap.set(city, []);
            }
            citiesMap.get(city)!.push(p);
        }

        // יצירת תיקיות לפי ערים
        for (const [city, cityProjects] of citiesMap) {
            const cityPath = path.join(externalExport, city);
            if (!fs.existsSync(cityPath)) fs.mkdirSync(cityPath, { recursive: true });

            for (const p of cityProjects) {
                // ניקוי שמות כדי שלא יהיו תווים אסורים
                const safeName = p.clientName.replace(/[<>:"/\\|?*]/g, '-');
                const folderName = `${p.id} - ${safeName}`;
                const pPath = path.join(cityPath, folderName);
            
                if (!fs.existsSync(pPath)) fs.mkdirSync(pPath);

                const files = await this.attachmentsRepository.find({ where: { projectId: p.id } });
                for (const f of files) {
                    const src = path.join(internalUploads, f.filename);
                    const dest = path.join(pPath, f.originalName);
                    
                    // העתקה רק אם המקור קיים והיעד עדיין לא קיים
                    if (fs.existsSync(src) && !fs.existsSync(dest)) {
                        fs.copyFileSync(src, dest);
                    }
                }
            }
        }
        // 4. יצירת גיבוי ZIP נוסף (אופציונלי)
        try {
            const zipFileName = `crm-backup-${new Date().toISOString().split('T')[0]}.zip`;
            console.log(`📦 Creating additional ZIP backup: ${zipFileName}`);
            // כאן יכול להיות קוד ליצירת ZIP אם נרצה
        } catch (zipError) {
            console.error("ZIP backup failed (not critical):", zipError);
        }

        console.log('✅ Daily Sync Completed Successfully');
        return { message: 'Sync OK' };
    } catch (e) {
        console.error("Sync Failed:", e);
        return { error: e.message };
    }
  }

  // פונקציה ידנית למי שרוצה לסנכרן
  async exportToCsv() {
    const projects = await this.findAll();
    
    // מיפוי הנתונים לעברית עבור האקסל
    const flatData = projects.map(p => ({
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
    const parser = new Parser({ withBOM: true }); 
    return parser.parse(flatData);
  }

  // --- המנגנון החדש עם תיקון זמן ישראל ---
  onModuleInit() {
    console.log('⏰ Scheduler initialized. Waiting for next minute check...');
    // בדיקה כל 60 שניות
    setInterval(() => {
        this.checkAndRunSync();
    }, 60000);
  }

  async checkAndRunSync() {
    try {
        // 1. שליפת השעה הרצויה מההגדרות
        const setting = await this.settingsService.findOne('sync_time');
        const targetTime = setting && setting.value ? setting.value : '00:00';

        // 2. חישוב השעה הנוכחית בישראל (במקום זמן השרת)
        const now = new Date();
        const timeInIsrael = now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Jerusalem', // <--- התיקון הקריטי!
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // פורמט 24 שעות (14:00 ולא 02:00 PM)
        });
        
        const todayDate = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Jerusalem' });

        // 3. הדפסה ללוג כדי שתראה שהשרת חי (תופיע בטרמינל השחור)
        console.log(`[Scheduler] Israel Time: ${timeInIsrael} | Target: ${targetTime} | Last Run: ${this.lastRunDate}`);

        // 4. ההחלטה
        if (timeInIsrael === targetTime && this.lastRunDate !== todayDate) {
            console.log(`✅ Time match! Starting daily sync...`);
            this.lastRunDate = todayDate; // מניעת ריצה כפולה
            await this.syncToLocalFolder();
        }
    } catch (e) {
        console.error("Scheduler Error:", e);
    }
  }
}