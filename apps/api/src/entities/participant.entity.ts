import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoomEntity } from './room.entity';
import { UserRole } from '@arabic-meet/shared';

@Entity('participants')
export class ParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  @Column({ length: 100 })
  displayName: string;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  isCameraOff: boolean;

  @Column({ default: false })
  isScreenSharing: boolean;

  @Column({ default: false })
  isHandRaised: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;

  @ManyToOne(() => UserEntity, user => user.participants)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => RoomEntity, room => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;
}
