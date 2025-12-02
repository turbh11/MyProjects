import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/project.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  FAILED = 'failed'
}

export enum EmailType {
  PROPOSAL = 'proposal',
  PAYMENT_REMINDER = 'payment_reminder',
  PROJECT_UPDATE = 'project_update',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  CONTRACT = 'contract',
  GENERAL = 'general'
}

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  to: string; // כתובת המייל של הלקוח

  @Column()
  subject: string;

  @Column('text')
  htmlContent: string;

  @Column('text', { nullable: true })
  textContent: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING
  })
  status: EmailStatus;

  @Column({
    type: 'enum',
    enum: EmailType,
    default: EmailType.GENERAL
  })
  type: EmailType;

  @Column({ nullable: true })
  projectId: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  trackingId: string; // מזהה ייחודי למעקב אחר המייל

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clickedAt: Date;

  @Column({ default: 0 })
  openCount: number; // כמה פעמים נפתח המייל

  @Column({ default: 0 })
  clickCount: number; // כמה פעמים נלחץ על קישור במייל

  @Column('text', { nullable: true })
  errorMessage: string; // הודעת שגיאה אם השליחה נכשלה

  @Column('json', { nullable: true })
  attachments: Array<{
    filename: string;
    path: string;
    contentType: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}