import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RoomEntity } from './room.entity';
import { UserEntity } from './user.entity';
import { PollOptionEntity } from './poll-option.entity';

@Entity('polls')
export class PollEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @ManyToOne(() => RoomEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @Column()
  createdBy: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @Column('text')
  question: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PollOptionEntity, option => option.poll, { cascade: true })
  options: PollOptionEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
