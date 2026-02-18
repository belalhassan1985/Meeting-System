import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoomEntity } from './room.entity';
import { UserEntity } from './user.entity';

export enum RecordingStatus {
  STARTING = 'starting',
  ACTIVE = 'active',
  STOPPING = 'stopping',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('recordings')
export class RecordingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'uuid' })
  startedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  egressId: string;

  @Column({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.STARTING })
  status: RecordingStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ManyToOne(() => RoomEntity)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'startedBy' })
  user: UserEntity;
}
