import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessExpense, ExpenseCategory } from './business-expense.entity';
import { CreateBusinessExpenseDto, UpdateBusinessExpenseDto } from './dto/create-business-expense.dto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import archiver from 'archiver';

@Injectable()
export class BusinessExpensesService {
  constructor(
    @InjectRepository(BusinessExpense)
    private expenseRepository: Repository<BusinessExpense>,
  ) {}

  async create(createExpenseDto: CreateBusinessExpenseDto, receiptFile?: any): Promise<BusinessExpense> {
    let receiptPath: string | undefined = undefined;
    
    if (receiptFile) {
      // שמירת קובץ הקבלה
      const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filename = `receipt-${Date.now()}-${receiptFile.originalname}`;
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, receiptFile.buffer);
      receiptPath = `/uploads/receipts/${filename}`; // נתיב יחסי לשרת
    }

    const expense = this.expenseRepository.create({
      description: createExpenseDto.description,
      amount: createExpenseDto.amount,
      category: createExpenseDto.category,
      expenseDate: new Date(createExpenseDto.expenseDate),
      supplierName: createExpenseDto.supplierName,
      invoiceNumber: createExpenseDto.invoiceNumber,
      projectId: createExpenseDto.projectId,
      isTaxDeductible: createExpenseDto.isTaxDeductible ?? true,
      taxDeductiblePercentage: createExpenseDto.taxDeductiblePercentage ?? 100,
      notes: createExpenseDto.notes,
      receiptPath
    });

    return await this.expenseRepository.save(expense);
  }

  async findAll(year?: number, month?: number, category?: ExpenseCategory): Promise<BusinessExpense[]> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.project', 'project')
      .orderBy('expense.expenseDate', 'DESC');

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    if (category) {
      queryBuilder.andWhere('expense.category = :category', { category });
    }

    return await queryBuilder.getMany();
  }

  async findByProject(projectId: number): Promise<BusinessExpense[]> {
    return await this.expenseRepository.find({
      where: { projectId },
      relations: ['project'],
      order: { expenseDate: 'DESC' }
    });
  }

  async update(id: number, updateExpenseDto: UpdateBusinessExpenseDto): Promise<BusinessExpense | null> {
    const updateData: any = { ...updateExpenseDto };
    if (updateExpenseDto.expenseDate) {
      updateData.expenseDate = new Date(updateExpenseDto.expenseDate);
    }

    await this.expenseRepository.update(id, updateData);
    return await this.expenseRepository.findOne({
      where: { id },
      relations: ['project']
    });
  }

  async remove(id: number): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    
    // מחיקת קובץ הקבלה אם קיים
    if (expense?.receiptPath) {
      const fullPath = path.join(process.cwd(), expense.receiptPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await this.expenseRepository.delete(id);
  }

  async getYearlyReport(year: number): Promise<{
    totalExpenses: number;
    taxDeductibleExpenses: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, number>;
    expenses: BusinessExpense[];
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(startDate, endDate)
      },
      relations: ['project'],
      order: { expenseDate: 'DESC' }
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const taxDeductibleExpenses = expenses
      .reduce((sum, expense) => {
        // אם יש אחוז ניכוי יותר מ-0, חשב אותו
        const percentage = (expense.taxDeductiblePercentage || 0) / 100;
        if (percentage > 0) {
          return sum + (Number(expense.amount) * percentage);
        }
        return sum;
      }, 0);

    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const byMonth = expenses.reduce((acc, expense) => {
      const month = expense.expenseDate.toLocaleString('he-IL', { month: 'long' });
      acc[month] = (acc[month] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      taxDeductibleExpenses,
      byCategory,
      byMonth,
      expenses
    };
  }

  async getMonthlyBreakdown(year: number): Promise<Array<{
    month: number;
    monthName: string;
    totalAmount: number;
    taxDeductible: number;
    expenseCount: number;
  }>> {
    const result: Array<{
      month: number;
      monthName: string;
      totalAmount: number;
      taxDeductible: number;
      expenseCount: number;
    }> = [];
    
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const expenses = await this.expenseRepository.find({
        where: {
          expenseDate: Between(startDate, endDate)
        }
      });

      const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const taxDeductible = expenses
        .filter(expense => expense.isTaxDeductible)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      result.push({
        month,
        monthName: startDate.toLocaleString('he-IL', { month: 'long' }),
        totalAmount,
        taxDeductible,
        expenseCount: expenses.length
      });
    }

    return result;
  }

  async getReceipt(id: number, res: Response): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    
    if (!expense || !expense.receiptPath) {
      throw new NotFoundException('חשבונית לא נמצאה');
    }

    const filePath = path.join(process.cwd(), expense.receiptPath.replace(/^\//, ''));
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('קובץ חשבונית לא נמצא');
    }

    res.sendFile(filePath);
  }

  async downloadReceiptsZip(year: number, res: Response): Promise<void> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    
    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(startDate, endDate),
      }
    });

    const expensesWithReceipts = expenses.filter(expense => expense.receiptPath);

    if (expensesWithReceipts.length === 0) {
      res.status(404).json({ message: 'לא נמצאו חשבוניות עבור שנת ' + year });
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=receipts-${year}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    expensesWithReceipts.forEach((expense, index) => {
      const filePath = path.join(process.cwd(), expense.receiptPath.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const expenseDate = new Date(expense.expenseDate);
        const fileName = `${index + 1}_${expense.description.replace(/[^a-zA-Z0-9א-ת]/g, '_')}_${expenseDate.getDate()}-${expenseDate.getMonth() + 1}${ext}`;
        archive.file(filePath, { name: fileName });
      }
    });

    archive.finalize();
  }

  async exportReport(year: number, format: 'pdf' | 'excel', res: Response): Promise<void> {
    const report = await this.getYearlyReport(year);
    
    if (format === 'excel') {
      // יצוא אקסל פשוט
      const csvContent = this.generateCSVReport(report);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=tax-report-${year}.csv`);
      res.send('\ufeff' + csvContent); // BOM for Hebrew support
    } else {
      // יצוא PDF (מחזיר JSON לעת עתה)
      res.json({
        message: 'יצוא PDF יוטמע בעדכון הבא',
        data: report
      });
    }
  }

  private generateCSVReport(report: any): string {
    let csv = 'תיאור,סכום,קטגוריה,תאריך,ספק,מספר חשבונית,זכאי לניכוי,אחוז ניכוי,סכום לניכוי,יש חשבונית\n';
    
    if (report.expenses) {
      report.expenses.forEach((expense: any) => {
        const deductibleAmount = expense.isTaxDeductible ? 
          (expense.amount * ((expense.taxDeductiblePercentage || 0) / 100)) : 0;
        const hasReceipt = expense.receiptPath ? 'כן' : 'לא';
        
        csv += `"${expense.description}",`;
        csv += `"${expense.amount}",`;
        csv += `"${this.getCategoryDisplayName(expense.category)}",`;
        csv += `"${new Date(expense.expenseDate).toLocaleDateString('he-IL')}",`;
        csv += `"${expense.supplierName || ''}",`;
        csv += `"${expense.invoiceNumber || ''}",`;
        csv += `"${expense.isTaxDeductible ? 'כן' : 'לא'}",`;
        csv += `"${expense.taxDeductiblePercentage || 0}%",`;
        csv += `"${deductibleAmount.toFixed(2)}",`;
        csv += `"${hasReceipt}"\n`;
      });
    }
    
    csv += `\nסיכום:\n`;
    csv += `"סה""כ הוצאות","${report.totalExpenses || 0}"\n`;
    csv += `"זכאי לניכוי","${report.taxDeductibleExpenses || 0}"\n`;
    csv += `"חיסכון במס (30%)","${Math.round((report.taxDeductibleExpenses || 0) * 0.3)}"\n`;
    
    // הוספת פירוט לפי קטגוריות
    if (report.byCategory) {
      csv += `\nפירוט לפי קטגוריות:\n`;
      Object.entries(report.byCategory).forEach(([category, amount]) => {
        csv += `"${this.getCategoryDisplayName(category)}","${amount}"\n`;
      });
    }

    return csv;
  }

  private getCategoryDisplayName(category: string): string {
    const categoryNames = {
      'fuel': '⛽ דלק',
      'materials': '🔧 חומרים',
      'tools': '🛠️ כלים',
      'transportation': '🚗 תחבורה',
      'office': '🏢 משרד',
      'professional_services': '👨‍💼 שירותים מקצועיים',
      'insurance': '🛡️ ביטוח',
      'phone': '📱 טלפון',
      'other': '📦 אחר'
    };
    return categoryNames[category] || category;
  }
}