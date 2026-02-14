import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoomEntity } from './room.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'uuid' })
  actorId: string;

  @Column({ length: 100 })
  actorName: string;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'uuid', nullable: true })
  targetId: string;

  @Column({ length: 100, nullable: true })
  targetName: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => RoomEntity, room => room.auditLogs)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;
}
