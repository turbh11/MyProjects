import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Visit } from '../visits/entities/visit.entity';
import { Attachment } from '../attachments/entities/attachment.entity';

export enum ProjectStatus {
  PRE_WORK = 'Pre-Work',          // טרם הוחל
  PROPOSAL = 'Proposal Sent',     // נשלחה הצעת מחיר (חדש!)
  IN_PROGRESS = 'In-Progress',    // בתהליך
  DONE = 'Done',                  // הסתיים
}

// שאר הקובץ נשאר אותו דבר...

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientName: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PRE_WORK })
  status: ProjectStatus;

  @Column()
  location: string;
  
  @Column({ nullable: true })
  street: string; 

  @Column({ nullable: true })
  buildingNumber: string; // עדיף string כי לפעמים יש "10ב" או "3/4"

  @Column({ nullable: true }) 
  district: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  // --- החדשים ---
  @Column({ nullable: true })
  phoneNumber: string; 

  @Column({ nullable: true })
  email: string;

  @Column({ default: false })
  isArchived: boolean;
  
  @Column('decimal', { precision: 5, scale: 2, default: 17.00 })
  vatPercentage: number; // אחוז מע"מ
  // --------------

  @Column({ type: 'text', nullable: true })
  proposalText: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;

  @OneToMany(() => Payment, (p) => p.project) payments: Payment[];
  @OneToMany(() => Visit, (v) => v.project) visits: Visit[];
  @OneToMany(() => Attachment, (a) => a.project) attachments: Attachment[];

  // פונקציות עזר לחישוב מע"מ
  getVatAmount(): number {
    return Number(this.totalPrice) * (Number(this.vatPercentage) / 100);
  }

  getTotalWithVat(): number {
    return Number(this.totalPrice) + this.getVatAmount();
  }

  getFormattedVatAmount(): string {
    return this.getVatAmount().toLocaleString('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    });
  }

  getFormattedTotalWithVat(): string {
    return this.getTotalWithVat().toLocaleString('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    });
  }
}