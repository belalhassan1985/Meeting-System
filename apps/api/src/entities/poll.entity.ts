import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PollOptionEntity } from './poll-option.entity';

@Entity('polls')
export class PollEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column('text')
  question: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PollOptionEntity, option => option.poll, { cascade: true })
  options: PollOptionEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
