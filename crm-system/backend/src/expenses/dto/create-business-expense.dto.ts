import { ExpenseCategory } from '../business-expense.entity';

export class CreateBusinessExpenseDto {
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  supplierName?: string;
  invoiceNumber?: string;
  projectId?: number;
  isTaxDeductible?: boolean;
  taxDeductiblePercentage?: number;
  notes?: string;
}

export class UpdateBusinessExpenseDto {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  expenseDate?: string;
  supplierName?: string;
  invoiceNumber?: string;
  projectId?: number;
  isTaxDeductible?: boolean;
  taxDeductiblePercentage?: number;
  notes?: string;
}