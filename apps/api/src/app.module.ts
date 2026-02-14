import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { RoomController } from './controllers/room.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { RoomService } from './services/room.service';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';
import { LiveKitService } from './services/livekit.service';
import { RoomGateway } from './gateways/room.gateway';
import { UserEntity } from './entities/user.entity';
import { RoomEntity } from './entities/room.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AdminEntity } from './entities/admin.entity';

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
    ]),
  ],
  controllers: [RoomController, AdminController, AuthController],
  providers: [RoomService, AdminService, AuthService, LiveKitService, RoomGateway],
})
export class AppModule {}
