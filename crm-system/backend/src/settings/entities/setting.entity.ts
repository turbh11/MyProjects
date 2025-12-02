import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Setting {
  @PrimaryColumn()
  key: string; // מפתח (למשל: 'proposal_template')

  @Column({ type: 'text' })
  value: string; // התוכן (הטקסט הארוך)
}