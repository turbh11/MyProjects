import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/project.entity';
import { Folder } from './folder.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string; // השם הפיזי בדיסק (למשל: image-123.jpg)

  @Column()
  originalName: string; // השם המקורי שהמשתמש העלה

  @Column({ nullable: true })
  folderId: number; // התיקיה שהקובץ נמצא בה

  @CreateDateColumn()
  uploadDate: Date;

  @ManyToOne(() => Project, (project) => project.attachments, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Folder, folder => folder.attachments, { nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @Column()
  projectId: number;
}