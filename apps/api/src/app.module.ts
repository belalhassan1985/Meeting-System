import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { RoomController } from './controllers/room.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { RoomMemberController } from './controllers/room-member.controller';
import { RoomService } from './services/room.service';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { RoomMemberService } from './services/room-member.service';
import { LiveKitService } from './services/livekit.service';
import { RoomGateway } from './gateways/room.gateway';
import { UserEntity } from './entities/user.entity';
import { RoomEntity } from './entities/room.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AdminEntity } from './entities/admin.entity';
import { RoomMemberEntity } from './entities/room-member.entity';

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
    ]),
  ],
  controllers: [RoomController, AdminController, AuthController, UserController, RoomMemberController],
  providers: [RoomService, AdminService, AuthService, UserService, RoomMemberService, LiveKitService, RoomGateway],
})
export class AppModule {}
