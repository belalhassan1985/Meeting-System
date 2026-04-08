import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PollEntity } from './poll.entity';

@Entity('poll_options')
export class PollOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pollId: string;

  @ManyToOne(() => PollEntity, poll => poll.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: PollEntity;

  @Column('text')
  text: string;
}
