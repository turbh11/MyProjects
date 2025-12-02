import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessExpensesService } from './business-expenses.service';
import { BusinessExpensesController } from './business-expenses.controller';
import { BusinessExpense } from './business-expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessExpense])],
  controllers: [BusinessExpensesController],
  providers: [BusinessExpensesService],
  exports: [BusinessExpensesService]
})
export class BusinessExpensesModule {}