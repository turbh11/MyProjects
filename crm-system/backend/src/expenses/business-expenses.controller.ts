import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BusinessExpensesService } from './business-expenses.service';
import { CreateBusinessExpenseDto, UpdateBusinessExpenseDto } from './dto/create-business-expense.dto';
import { ExpenseCategory } from './business-expense.entity';

@Controller('business-expenses')
export class BusinessExpensesController {
  constructor(private readonly businessExpensesService: BusinessExpensesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('receipt'))
  create(
    @Body() createBusinessExpenseDto: CreateBusinessExpenseDto,
    @UploadedFile() receiptFile?: any
  ) {
    return this.businessExpensesService.create(createBusinessExpenseDto, receiptFile);
  }

  @Get()
  findAll(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('category') category?: ExpenseCategory
  ) {
    return this.businessExpensesService.findAll(
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
      category
    );
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.businessExpensesService.findByProject(+projectId);
  }

  @Get('yearly-report/:year')
  getYearlyReport(@Param('year') year: string) {
    return this.businessExpensesService.getYearlyReport(parseInt(year));
  }

  @Get('monthly-breakdown/:year')
  getMonthlyBreakdown(@Param('year') year: string) {
    return this.businessExpensesService.getMonthlyBreakdown(parseInt(year));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessExpenseDto: UpdateBusinessExpenseDto) {
    return this.businessExpensesService.update(+id, updateBusinessExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessExpensesService.remove(+id);
  }

  @Get('receipt/:id')
  async getReceipt(@Param('id') id: string, @Res() res: Response) {
    return this.businessExpensesService.getReceipt(+id, res);
  }

  @Get('download-receipts/:year')
  async downloadReceiptsZip(@Param('year') year: string, @Res() res: Response) {
    return this.businessExpensesService.downloadReceiptsZip(parseInt(year), res);
  }

  @Get('export-report/:year')
  async exportReport(
    @Param('year') year: string,
    @Query('format') format: string,
    @Res() res: Response
  ) {
    return this.businessExpensesService.exportReport(parseInt(year), format as 'pdf' | 'excel', res);
  }
}