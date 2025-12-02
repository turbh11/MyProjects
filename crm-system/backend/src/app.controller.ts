import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/dashboard-stats')
  getDashboardStats() {
    return {
      success: true,
      totalRevenue: 125000,
      totalExpenses: 45000,
      netProfit: 80000,
      totalPotential: 200000,
      activeProjects: 12,
      pendingTasks: 8,
      currentMonthRevenue: 25000,
      taxInfo: {
        untaxedAmount: 15000,
        calculatedTax: 2550,
        taxPercentage: 17
      },
      lastUpdated: new Date().toISOString()
    };
  }
}
