import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { RoomEntity } from '../entities/room.entity';
import { ParticipantEntity } from '../entities/participant.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AdminEntity } from '../entities/admin.entity';
import { RoomMemberEntity } from '../entities/room-member.entity';
import { RecordingEntity } from '../entities/recording.entity';
import { PollEntity } from '../entities/poll.entity';
import { PollOptionEntity } from '../entities/poll-option.entity';
import { PollAnswerEntity } from '../entities/poll-answer.entity';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Support DATABASE_URL or individual variables
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [UserEntity, RoomEntity, ParticipantEntity, AuditLogEntity, AdminEntity, RoomMemberEntity, RecordingEntity, PollEntity, PollOptionEntity, PollAnswerEntity],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    };
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'admin',
    database: process.env.DATABASE_NAME || 'arabicmeet',
    entities: [UserEntity, RoomEntity, ParticipantEntity, AuditLogEntity, AdminEntity, RoomMemberEntity, RecordingEntity, PollEntity, PollOptionEntity, PollAnswerEntity],
    synchronize: true, // We need this true for newly added entities during development
    logging: process.env.NODE_ENV === 'development',
  };
};
