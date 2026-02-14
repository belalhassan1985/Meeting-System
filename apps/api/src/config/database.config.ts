import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { RoomEntity } from '../entities/room.entity';
import { ParticipantEntity } from '../entities/participant.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AdminEntity } from '../entities/admin.entity';
import { RoomMemberEntity } from '../entities/room-member.entity';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Support DATABASE_URL or individual variables
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [UserEntity, RoomEntity, ParticipantEntity, AuditLogEntity, AdminEntity, RoomMemberEntity],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    };
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'arabicmeet',
    password: process.env.DATABASE_PASSWORD || 'changeme123',
    database: process.env.DATABASE_NAME || 'arabicmeet',
    entities: [UserEntity, RoomEntity, ParticipantEntity, AuditLogEntity, AdminEntity, RoomMemberEntity],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  };
};
