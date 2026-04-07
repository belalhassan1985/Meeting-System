import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PollEntity } from './poll.entity';
import { PollOptionEntity } from './poll-option.entity';

@Entity('poll_answers')
export class PollAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pollId: string;

  @ManyToOne(() => PollEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: PollEntity;

  @Column()
  optionId: string;

  @ManyToOne(() => PollOptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: PollOptionEntity;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
