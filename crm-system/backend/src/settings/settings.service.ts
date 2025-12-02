import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
  ) {}

  async onModuleInit() {
    // תמיד מעדכן את התבנית לגרסה האחרונה (גם אם קיימת)
    await this.save('proposal_template', `בס"ד

מוטי מנחם
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

מוטי מנחם
הנדסת בניין

אימייל: Eng.motimen@gmail.com
נייד: 0522-670274`);

    // הגדרת זמן סנכרון ברירת מחדל
    const syncTimeExists = await this.settingsRepo.findOneBy({ key: 'sync_time' });
    if (!syncTimeExists) {
      await this.save('sync_time', '00:00');
    }
    
    console.log('✅ Settings initialized with default templates');
  }

  // פונקציות עזר
  findOne(key: string) { return this.settingsRepo.findOneBy({ key }); }
  
  async getTemplate() {
    return this.settingsRepo.findOneBy({ key: 'proposal_template' });
  }

  // הפונקציה החשובה ששומרת או מעדכנת
  async save(key: string, value: string) {
    let setting = await this.settingsRepo.findOneBy({ key });
    if (!setting) {
      setting = this.settingsRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.settingsRepo.save(setting);
  }

  async getEngineerInfo() {
    const name = await this.findOne('engineer_name');
    const email = await this.findOne('engineer_email');
    const phone = await this.findOne('engineer_phone');
    
    return {
      name: name?.value || 'מוטי מנחם',
      email: email?.value || 'Eng.motimen@gmail.com',
      phone: phone?.value || '052-2670274'
    };
  }

  async updateEngineerInfo(engineerInfo: { name: string, email: string, phone: string }) {
    await Promise.all([
      this.save('engineer_name', engineerInfo.name),
      this.save('engineer_email', engineerInfo.email),
      this.save('engineer_phone', engineerInfo.phone)
    ]);
    
    // עדכון התבנית עם הפרטים החדשים
    await this.updateTemplateWithEngineerInfo(engineerInfo);
    
    return { success: true, message: 'פרטי המהנדס עודכנו בהצלחה' };
  }

  private async updateTemplateWithEngineerInfo(engineerInfo: { name: string, email: string, phone: string }) {
    // יצירת תבנית חדשה עם הפרטים החדשים
    const newTemplate = this.getDefaultTemplate(engineerInfo);
    
    // שמירת התבנית החדשה
    await this.save('proposal_template', newTemplate);
  }

  private getDefaultTemplate(engineerInfo: { name: string, email: string, phone: string }): string {
    const { name, email, phone } = engineerInfo;
    
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

  async resetTemplateToDefault() {
    const engineerInfo = await this.getEngineerInfo();
    const defaultTemplate = this.getDefaultTemplate(engineerInfo);
    await this.save('proposal_template', defaultTemplate);
    return { success: true, message: 'התבנית אופסה לברירת מחדל' };
  }
}