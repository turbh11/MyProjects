import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  create(createExpenseDto: any) {
    const expense = this.expensesRepository.create(createExpenseDto);
    return this.expensesRepository.save(expense);
  }

  findByProject(projectId: number) {
    return this.expensesRepository.find({
      where: { projectId },
      order: { date: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.expensesRepository.findOne({ where: { id } });
  }

  update(id: number, updateExpenseDto: any) {
    return this.expensesRepository.update(id, updateExpenseDto);
  }

  remove(id: number) {
    return this.expensesRepository.delete(id);
  }

  // קבלת הוצאות לחודש ספציפי
  async getMonthlyExpenses(month: number, year: number): Promise<number> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const expenses = await this.expensesRepository
      .createQueryBuilder('expense')
      .where('expense.date BETWEEN :start AND :end', {
        start: monthStart,
        end: monthEnd
      })
      .getMany();

    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }

  // קבלת כל ההוצאות
  async getTotalExpenses(): Promise<number> {
    const expenses = await this.expensesRepository.find();
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }
}