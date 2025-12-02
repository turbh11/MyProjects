import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { TaxService } from './tax.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  getTaxInfo() {
    return this.taxService.getTaxInfo();
  }

  @Get('info')  
  getTaxInfoAlias() {
    return this.taxService.getTaxInfo();
  }

  @Put('percentage')
  updateTaxPercentage(@Body() body: { percentage: number }) {
    return this.taxService.updateTaxPercentage(body.percentage);
  }

  @Post('reset')
  resetTaxTracker() {
    return this.taxService.resetTaxTracker();
  }

  @Post('recalculate')
  recalculateFromPayments() {
    return this.taxService.recalculateFromExistingPayments();
  }

  @Get('monthly/:year/:month')
  getMonthlyRevenue(@Body('year') year: number, @Body('month') month: number) {
    return this.taxService.getMonthlyRevenue(month, year);
  }
}