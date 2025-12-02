import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../projects/project.entity';

export enum ExpenseCategory {
  FUEL = 'fuel',
  MATERIALS = 'materials', 
  TOOLS = 'tools',
  TRANSPORTATION = 'transportation',
  OFFICE = 'office',
  PROFESSIONAL_SERVICES = 'professional_services',
  INSURANCE = 'insurance',
  PHONE = 'phone',
  OTHER = 'other'
}

@Entity('business_expenses')
export class BusinessExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER
  })
  category: ExpenseCategory;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  receiptPath: string; // נתיב לקובץ הקבלה/חשבונית

  @Column({ nullable: true })
  projectId: number;

  @ManyToOne(() => Project, project => project.id, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ default: false })
  isTaxDeductible: boolean;

  @Column({ default: 100 })
  taxDeductiblePercentage: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}