import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_tracker')
export class TaxTracker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  untaxedAmount: number; // סכום מצטבר שלא שולם ממנו מס

  @Column('decimal', { precision: 5, scale: 2, default: 17 })
  taxPercentage: number; // אחוז המס (ברירת מחדל 17%)

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  calculatedTax: number; // מס מחושב

  @Column({ nullable: true })
  lastResetDate: Date; // תאריך האפס האחרון

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}