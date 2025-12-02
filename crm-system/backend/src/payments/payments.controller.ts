import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: any) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get('project/:id')
  findAllByProject(@Param('id') id: string) {
    return this.paymentsService.findAllByProject(+id);
  }

  @Get('monthly-data')
  async getMonthlyData(
    @Query('month') month: number,
    @Query('year') year: number
  ) {
    return this.paymentsService.getMonthlyData(month, year);
  }

  @Get('monthly-breakdown')
  async getMonthlyBreakdown(@Query('months') months?: number) {
    const monthsCount = months ? Number(months) : 6;
    return this.paymentsService.getMonthlyBreakdown(monthsCount);
  }

  @Get('export/csv')
  async exportCSV(
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('type') type: string,
    @Res() res: Response
  ) {
    const csvData = type === 'yearly' 
      ? await this.paymentsService.exportYearlyCSV(year)
      : await this.paymentsService.exportMonthlyCSV(month, year);
    
    // שימוש באנגלית כדי למנוע שגיאות header
    const fileName = type === 'yearly' 
      ? `yearly_report_${year}.csv`
      : `monthly_report_${month}_${year}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvData); // BOM for Hebrew support
  }
}