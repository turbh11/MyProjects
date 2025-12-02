import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/project.entity';

@Entity()
export class Visit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string; // מה בוצע בביקור

  @Column({ type: 'text', nullable: true })
  nextActions: string; // מה צריך לעשות לפעם הבאה

  @CreateDateColumn()
  visitDate: Date; // מתי זה קרה (אוטומטית עכשיו, אפשר לשנות אם רוצים)

  @ManyToOne(() => Project, (project) => project.visits, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: number;
}