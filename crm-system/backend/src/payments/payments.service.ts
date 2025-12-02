import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Project } from '../projects/project.entity';
import { TaxService } from '../tax/tax.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private taxService: TaxService,
    private expensesService: ExpensesService,
  ) {}

  async create(createPaymentDto: any) {
    // אם לא נשלח תאריך, תשתמש בעכשיו. אם נשלח - תשתמש בו.
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      date: createPaymentDto.date ? new Date(createPaymentDto.date) : new Date(),
    });
    
    const savedPayment = await this.paymentsRepository.save(payment);
    
    // עדכון מערכת המס - savedPayment הוא אובייקט יחיד, לא מערך
    if (savedPayment && typeof savedPayment === 'object' && 'amount' in savedPayment) {
      await this.taxService.addPayment(Number(savedPayment.amount));
    }
    
    return savedPayment;
  }

  // שליפת כל התשלומים של פרויקט ספציפי
  findAllByProject(projectId: number) {
    return this.paymentsRepository.find({
      where: { projectId },
      order: { date: 'DESC' }
    });
  }

  async exportMonthlyCSV(month: number, year: number): Promise<string> {
    try {
      // שליפת כל התשלומים בחודש המבוקש
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      const payments = await this.paymentsRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.project', 'project')
        .where('payment.date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd
        })
        .orderBy('payment.date', 'DESC')
        .getMany();

      // חישוב סיכומים לחודש
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const taxInfo = await this.taxService.getTaxInfo();
      const calculatedTax = totalRevenue * (taxInfo.taxPercentage / 100);
      
      // יצירת כותרות CSV עם הוצאות ומס
      const headers = [
        'שם לקוח',
        'תיאור פרויקט', 
        'תאריך תשלום',
        'סכום תשלום',
        'הוצאות בפועל',
        'מס משוער',
        'מזהה פרויקט'
      ];

      // חישוב הוצאות אמיתיות לחודש
      const realMonthlyExpenses = await this.expensesService.getMonthlyExpenses(month, year);
      
      // יצירת שורות הנתונים
      const rows = await Promise.all(payments.map(async payment => {
        // חישוב הוצאות לפרויקט הזה (מהמערכת)
        let projectExpenses = 0;
        if (payment.project) {
          try {
            const projectExpensesData = await this.expensesService.findByProject(payment.projectId);
            projectExpenses = projectExpensesData.reduce((sum, expense) => sum + Number(expense.amount), 0);
          } catch (error) {
            projectExpenses = 0;
          }
        }
        
        const paymentTax = Number(payment.amount) * (taxInfo.taxPercentage / 100);
        
        return [
          payment.project?.clientName || 'לא זמין',
          payment.project?.description || 'לא זמין',
          payment.date.toLocaleDateString('he-IL'),
          `₪${Number(payment.amount).toLocaleString()}`,
          `₪${projectExpenses.toLocaleString()}`,
          `₪${paymentTax.toLocaleString()}`,
          payment.projectId.toString()
        ];
      }));
      
      // הוספת שורת סיכום
      const summaryRow = [
        'סיכום חודשי',
        `חודש ${month}/${year}`,
        '',
        `₪${totalRevenue.toLocaleString()}`,
        `₪${realMonthlyExpenses.toLocaleString()}`,
        `₪${calculatedTax.toLocaleString()}`,
        ''
      ];

      // חיבור הכל יחד
      const csvContent = [headers, ...rows, [], summaryRow]
        .map(row => Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : '')
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error creating CSV:', error);
      throw new Error('Failed to create CSV export');
    }
  }

  async exportYearlyCSV(year: number): Promise<string> {
    try {
      // שליפת כל התשלומים בשנה המבוקשת
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      const payments = await this.paymentsRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.project', 'project')
        .where('payment.date BETWEEN :start AND :end', {
          start: yearStart,
          end: yearEnd
        })
        .orderBy('payment.date', 'DESC')
        .getMany();

      // חישוב סיכומים לשנה
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const taxInfo = await this.taxService.getTaxInfo();
      const calculatedTax = totalRevenue * (taxInfo.taxPercentage / 100);
      
      // חישוב הוצאות אמיתיות לשנה
      let totalExpenses = 0;
      for (let month = 1; month <= 12; month++) {
        try {
          const monthlyExpenses = await this.expensesService.getMonthlyExpenses(month, year);
          totalExpenses += monthlyExpenses;
        } catch (error) {
          console.error(`Error getting expenses for ${month}/${year}:`, error);
        }
      }
      
      // יצירת כותרות CSV
      const headers = [
        'שם לקוח',
        'תיאור פרויקט',
        'חודש',
        'תאריך תשלום',
        'סכום תשלום',
        'הוצאות בפועל',
        'מס משוער',
        'מזהה פרויקט'
      ];

      // יצירת שורות הנתונים
      const rows = await Promise.all(payments.map(async payment => {
        const paymentMonth = payment.date.getMonth() + 1;
        
        // חישוב הוצאות אמיתיות לפרויקט
        let projectExpenses = 0;
        try {
          const projectExpensesData = await this.expensesService.findByProject(payment.projectId);
          projectExpenses = projectExpensesData.reduce((sum, expense) => sum + Number(expense.amount), 0);
        } catch (error) {
          projectExpenses = 0;
        }
        
        const paymentTax = Number(payment.amount) * (taxInfo.taxPercentage / 100);
        
        return [
          payment.project?.clientName || 'לא זמין',
          payment.project?.description || 'לא זמין',
          new Date(payment.date).toLocaleDateString('he-IL', { month: 'long' }),
          payment.date.toLocaleDateString('he-IL'),
          `₪${Number(payment.amount).toLocaleString()}`,
          `₪${projectExpenses.toLocaleString()}`,
          `₪${paymentTax.toLocaleString()}`,
          payment.projectId.toString()
        ];
      }));
      
      // הוספת שורת סיכום שנתי
      const summaryRow = [
        'סיכום שנתי',
        `שנת ${year}`,
        '',
        '',
        `₪${totalRevenue.toLocaleString()}`,
        `₪${totalExpenses.toLocaleString()}`,
        `₪${calculatedTax.toLocaleString()}`,
        ''
      ];

      // חיבור הכל יחד
      const csvContent = [headers, ...rows, [], summaryRow]
        .map(row => Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : '')
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error creating yearly CSV:', error);
      throw new Error('Failed to create yearly CSV export');
    }
  }

  async getMonthlyData(month: number, year: number): Promise<any> {
    try {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      // שליפת תשלומים לחודש
      const payments = await this.paymentsRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.project', 'project')
        .where('payment.date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd
        })
        .getMany();

      // חישוב הכנסות בפועל
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // קבלת הוצאות בפועל לחודש מהמערכת
      let totalExpenses = 0;
      try {
        totalExpenses = await this.expensesService.getMonthlyExpenses(month, year);
        console.log(`Real expenses for ${month}/${year}: ${totalExpenses}`);
      } catch (error) {
        console.error('Error getting monthly expenses:', error);
        // fallback להערכה אם יש שגיאה
        totalExpenses = totalRevenue * 0.25;
      }

      // חישוב מס
      const taxInfo = await this.taxService.getTaxInfo();
      const calculatedTax = totalRevenue * (taxInfo.taxPercentage / 100);
      const netProfit = totalRevenue - totalExpenses;

      return {
        month,
        year,
        revenue: Math.round(totalRevenue),
        expenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        tax: Math.round(calculatedTax),
        taxPercentage: taxInfo.taxPercentage,
        paymentsCount: payments.length
      };
    } catch (error) {
      console.error('Error getting monthly data:', error);
      return {
        month,
        year,
        revenue: 0,
        expenses: 0,
        netProfit: 0,
        tax: 0,
        taxPercentage: 17,
        paymentsCount: 0
      };
    }
  }

  async getMonthlyBreakdown(monthsCount: number = 6): Promise<any[]> {
    try {
      const currentDate = new Date();
      const breakdown: any[] = [];

      for (let i = monthsCount - 1; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = targetDate.getMonth() + 1;
        const year = targetDate.getFullYear();

        const monthData = await this.getMonthlyData(month, year);
        
        const monthEntry = {
          ...monthData,
          monthName: targetDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
          monthShort: targetDate.toLocaleDateString('he-IL', { month: 'long' })
        };
        
        breakdown.push(monthEntry);
      }

      return breakdown;
    } catch (error) {
      console.error('Error getting monthly breakdown:', error);
      return [];
    }
  }
}