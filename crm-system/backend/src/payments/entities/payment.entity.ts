import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/project.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  note: string; // הערה (למשל: "מקדמה", "תשלום גמר")

  @CreateDateColumn()
  date: Date;

  // חיבור לפרויקט (הרבה תשלומים לפרויקט אחד)
  @ManyToOne(() => Project, (project) => project.payments, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: number; // שיהיה קל לשלוף לפי ID
}