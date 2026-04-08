import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PollEntity } from './poll.entity';
import { PollOptionEntity } from './poll-option.entity';

@Entity('poll_answers')
export class PollAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pollId: string;

  @ManyToOne(() => PollEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: PollEntity;

  @Column({ type: 'uuid' })
  optionId: string;

  @ManyToOne(() => PollOptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: PollOptionEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
