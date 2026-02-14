import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ParticipantEntity } from './participant.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true, unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ParticipantEntity, participant => participant.user)
  participants: ParticipantEntity[];
}
