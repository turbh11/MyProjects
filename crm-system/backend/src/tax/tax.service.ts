import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxTracker } from './entities/tax-tracker.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxTracker)
    private taxRepository: Repository<TaxTracker>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  private async ensureInitialTaxRecord() {
    try {
      const count = await this.taxRepository.count();
      if (count === 0) {
        const tracker = this.taxRepository.create({
          untaxedAmount: 0,
          taxPercentage: 17,
          calculatedTax: 0,
        });
        await this.taxRepository.save(tracker);
        console.log('✅ Tax tracker initialized with default values');
      }
    } catch (error) {
      console.warn('Tax initialization skipped:', error.message);
    }
  }

  async getTaxInfo(): Promise<TaxTracker> {
    let tracker = await this.taxRepository.findOne({ where: {} });
    
    if (!tracker) {
      // נוודא שהטבלה קיימת ונוכל לכתוב אליה
      await this.ensureInitialTaxRecord();
      tracker = await this.taxRepository.findOne({ where: {} });
      
      if (!tracker) {
        // אם עדיין אין, ניצור מחדש עם הגדרות בטוחות יותר
        tracker = this.taxRepository.create({
          untaxedAmount: 0,
          taxPercentage: 17,
          calculatedTax: 0,
        });
        tracker = await this.taxRepository.save(tracker);
      }
    }

    return tracker;
  }

  async addPayment(amount: number): Promise<TaxTracker> {
    const tracker = await this.getTaxInfo();
    
    tracker.untaxedAmount += amount;
    tracker.calculatedTax = (tracker.untaxedAmount * tracker.taxPercentage) / 100;
    
    return this.taxRepository.save(tracker);
  }

  async updateTaxPercentage(percentage: number): Promise<TaxTracker> {
    const tracker = await this.getTaxInfo();
    
    tracker.taxPercentage = percentage;
    tracker.calculatedTax = (tracker.untaxedAmount * tracker.taxPercentage) / 100;
    
    return this.taxRepository.save(tracker);
  }

  async resetTaxTracker(): Promise<TaxTracker> {
    const tracker = await this.getTaxInfo();
    
    tracker.untaxedAmount = 0;
    tracker.calculatedTax = 0;
    tracker.lastResetDate = new Date();
    
    return this.taxRepository.save(tracker);
  }

  async getMonthlyRevenue(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.date >= :startDate AND payment.date <= :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();
  }

  // פונקציה לחישוב מחדש של המס מכל התשלומים הקיימים
  async recalculateFromExistingPayments() {
    try {
      await this.ensureInitialTaxRecord();
      
      // שליפת כל התשלומים
      const payments = await this.paymentRepository.find();
      
      // חישוב סכום כולל
      const totalAmount = payments.reduce((sum, payment) => {
        return sum + Number(payment.amount || 0);
      }, 0);

      // עדכון מערכת המס
      const tracker = await this.taxRepository.findOne({
        where: {},
        order: { id: 'DESC' }
      });

      if (tracker) {
        tracker.untaxedAmount = totalAmount;
        tracker.calculatedTax = totalAmount * (tracker.taxPercentage / 100);
        await this.taxRepository.save(tracker);
        
        console.log(`✅ Tax recalculated: ${totalAmount} total, ${tracker.calculatedTax} tax`);
        return tracker;
      }
      
    } catch (error) {
      console.error('Error recalculating tax:', error);
      throw new Error('Failed to recalculate tax from existing payments');
    }
  }
}