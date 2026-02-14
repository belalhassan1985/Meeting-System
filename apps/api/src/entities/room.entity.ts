import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ParticipantEntity } from './participant.entity';
import { AuditLogEntity } from './audit-log.entity';

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 25 })
  maxParticipants: number;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ type: 'uuid' })
  hostId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ParticipantEntity, participant => participant.room)
  participants: ParticipantEntity[];

  @OneToMany(() => AuditLogEntity, log => log.room)
  auditLogs: AuditLogEntity[];
}
