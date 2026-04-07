import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { RoomController } from './controllers/room.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { RoomMemberController } from './controllers/room-member.controller';
import { RecordingController } from './controllers/recording.controller';
import { RoomService } from './services/room.service';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { RoomMemberService } from './services/room-member.service';
import { RecordingService } from './services/recording.service';
import { LiveKitService } from './services/livekit.service';
import { RoomGateway } from './gateways/room.gateway';
import { UserEntity } from './entities/user.entity';
import { RoomEntity } from './entities/room.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AdminEntity } from './entities/admin.entity';
import { RoomMemberEntity } from './entities/room-member.entity';
import { RecordingEntity } from './entities/recording.entity';
import { PollEntity } from './entities/poll.entity';
import { PollOptionEntity } from './entities/poll-option.entity';
import { PollAnswerEntity } from './entities/poll-answer.entity';
import { PollController } from './controllers/poll.controller';
import { PollService } from './services/poll.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([
      UserEntity,
      RoomEntity,
      ParticipantEntity,
      AuditLogEntity,
      AdminEntity,
      RoomMemberEntity,
      RecordingEntity,
      PollEntity,
      PollOptionEntity,
      PollAnswerEntity,
    ]),
  ],
  controllers: [RoomController, AdminController, AuthController, UserController, RoomMemberController, RecordingController, PollController],
  providers: [RoomService, AdminService, AuthService, UserService, RoomMemberService, RecordingService, LiveKitService, RoomGateway, PollService],
})
export class AppModule {}
