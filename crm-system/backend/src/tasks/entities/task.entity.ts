import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Project } from '../../projects/project.entity'; // וודא שהנתיב נכון

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ default: false })
  isDone: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // --- הוסף את זה ---
  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  project: Project;

  @Column({ nullable: true })
  projectId: number;
  // -----------------
}