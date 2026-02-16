import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RoomEntity } from '../entities/room.entity';
import { ParticipantEntity } from '../entities/participant.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { LiveKitService } from './livekit.service';
import { UserRole, CreateRoomDto, JoinRoomDto, RoomJoinResponse } from '@arabic-meet/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(ParticipantEntity)
    private participantRepository: Repository<ParticipantEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
    private livekitService: LiveKitService,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto) {
    let user = createRoomDto.userId
      ? await this.userRepository.findOne({ where: { id: createRoomDto.userId } })
      : await this.userRepository.findOne({ where: { name: createRoomDto.hostName } });
    
    if (!user) {
      const username = `user_${uuidv4().substring(0, 8)}`;
      user = this.userRepository.create({
        id: createRoomDto.userId || uuidv4(),
        name: createRoomDto.hostName,
        username: username,
        password: '', // Temporary password for auto-created users
      });
      await this.userRepository.save(user);
    }

    const room = this.roomRepository.create({
      name: createRoomDto.name,
      description: createRoomDto.description,
      maxParticipants: createRoomDto.maxParticipants,
      hostId: user.id,
      isActive: true,
    });

    await this.roomRepository.save(room);

    await this.livekitService.createRoom(room.id, room.maxParticipants);

    this.logger.log(`Room created: ${room.id} by ${user.name}`);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      hostId: room.hostId,
      inviteLink: `/room/${room.id}`,
    };
  }

  async getRooms() {
    const rooms = await this.roomRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participantCount = await this.participantRepository.count({
          where: { roomId: room.id, leftAt: IsNull() },
        });

        return {
          ...room,
          participantCount,
        };
      }),
    );

    return roomsWithCounts;
  }

  async getRoom(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async joinRoom(joinRoomDto: JoinRoomDto): Promise<RoomJoinResponse> {
    const room = await this.getRoom(joinRoomDto.roomId);

    if (room.isLocked) {
      throw new BadRequestException('Room is locked');
    }

    const activeParticipants = await this.participantRepository.count({
      where: { roomId: room.id, leftAt: IsNull() },
    });

    if (activeParticipants >= room.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    let user = joinRoomDto.userId
      ? await this.userRepository.findOne({ where: { id: joinRoomDto.userId } })
      : null;

    if (!user) {
      const username = `user_${uuidv4().substring(0, 8)}`;
      user = this.userRepository.create({
        id: uuidv4(),
        name: joinRoomDto.userName,
        username: username,
        password: '', // Temporary password for auto-created users
      });
      await this.userRepository.save(user);
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: { userId: user.id, roomId: room.id, leftAt: IsNull() },
    });

    let participant: ParticipantEntity;
    let role = UserRole.PARTICIPANT;

    if (existingParticipant) {
      participant = existingParticipant;
      role = participant.role;
      this.logger.log(`🔄 Existing participant found: ${user.name}, role: ${role}`);
    } else {
      // Check if user has ADMIN role in UserEntity
      if (user.role === 'ADMIN') {
        role = UserRole.ADMIN;
      } else if (user.id === room.hostId) {
        role = UserRole.HOST;
      } else {
        role = UserRole.PARTICIPANT;
      }
      
      // Debug logging
      this.logger.log(`🔍 Role Assignment Debug:`, {
        userName: user.name,
        userId: user.id,
        userEntityRole: user.role,
        roomHostId: room.hostId,
        isHost: user.id === room.hostId,
        assignedRole: role,
      });

      participant = this.participantRepository.create({
        userId: user.id,
        roomId: room.id,
        role,
        displayName: joinRoomDto.userName,
      });
      await this.participantRepository.save(participant);
    }

    const livekitToken = await this.livekitService.generateToken(
      room.id,
      user.id,
      joinRoomDto.userName,
      role,
    );

    const participants = await this.participantRepository.find({
      where: { roomId: room.id, leftAt: IsNull() },
    });

    await this.createAuditLog(
      room.id,
      user.id,
      joinRoomDto.userName,
      'JOIN_ROOM',
      null,
      null,
      `User joined the room`,
    );

    return {
      livekitToken,
      livekitUrl: this.livekitService.getLivekitUrl(),
      userRole: role,
      roomInfo: room,
      participants: participants.map(p => ({
        id: p.id,
        userId: p.userId,
        roomId: p.roomId,
        role: p.role,
        displayName: p.displayName,
        isMuted: p.isMuted,
        isCameraOff: p.isCameraOff,
        isScreenSharing: p.isScreenSharing,
        isHandRaised: p.isHandRaised,
        joinedAt: p.joinedAt,
      })),
    };
  }

  async leaveRoom(roomId: string, userId: string) {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });

    if (participant) {
      participant.leftAt = new Date();
      await this.participantRepository.save(participant);

      await this.createAuditLog(
        roomId,
        userId,
        participant.displayName,
        'LEAVE_ROOM',
        null,
        null,
        'User left the room',
      );
    }
  }

  async updateParticipantMedia(
    roomId: string,
    userId: string,
    updates: Partial<ParticipantEntity>,
  ) {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    Object.assign(participant, updates);
    await this.participantRepository.save(participant);

    return participant;
  }

  async getParticipants(roomId: string) {
    return this.participantRepository.find({
      where: { roomId, leftAt: IsNull() },
    });
  }

  async createAuditLog(
    roomId: string,
    actorId: string,
    actorName: string,
    action: string,
    targetId: string | null,
    targetName: string | null,
    details: string,
  ) {
    const log = this.auditLogRepository.create({
      roomId: roomId,
      actorId: actorId,
      actorName: actorName,
      action: action,
      targetId: targetId,
      targetName: targetName,
      details: details,
    } as Partial<AuditLogEntity>);

    await this.auditLogRepository.save(log);
    return log;
  }

  async lockRoom(roomId: string, isLocked: boolean) {
    const room = await this.getRoom(roomId);
    room.isLocked = isLocked;
    await this.roomRepository.save(room);
    return room;
  }

  async promoteParticipant(roomId: string, userId: string, newRole: UserRole) {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.role = newRole;
    await this.participantRepository.save(participant);
    return participant;
  }
}
