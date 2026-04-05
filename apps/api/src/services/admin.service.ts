import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity';
import { RoomEntity } from '../entities/room.entity';
import { ParticipantEntity } from '../entities/participant.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(ParticipantEntity)
    private participantRepository: Repository<ParticipantEntity>,
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const participations = await this.participantRepository.find({
      where: { userId: id },
      relations: ['room'],
      order: { joinedAt: 'DESC' },
      take: 10,
    });

    return {
      ...user,
      recentParticipations: participations,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.participantRepository.delete({ userId: id });
    await this.userRepository.delete(id);
  }

  async getAllRooms(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [rooms, total] = await this.roomRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const activeParticipants = await this.participantRepository.count({
          where: { roomId: room.id, leftAt: IsNull() },
        });

        const totalParticipants = await this.participantRepository.count({
          where: { roomId: room.id },
        });

        return {
          ...room,
          activeParticipants,
          totalParticipants,
        };
      }),
    );

    return {
      data: roomsWithParticipants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteRoom(id: string) {
    const room = await this.roomRepository.findOne({ where: { id } });
    
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    await this.participantRepository.delete({ roomId: id });
    await this.auditLogRepository.delete({ roomId: id });
    await this.roomRepository.delete(id);
  }

  async closeRoom(id: string) {
    const room = await this.roomRepository.findOne({ where: { id } });
    
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    room.isActive = false;
    await this.roomRepository.save(room);

    const activeParticipants = await this.participantRepository.find({
      where: { roomId: id, leftAt: IsNull() },
    });

    for (const participant of activeParticipants) {
      participant.leftAt = new Date();
      await this.participantRepository.save(participant);
    }

    return room;
  }

  async reopenRoom(id: string) {
    const room = await this.roomRepository.findOne({ where: { id } });
    
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    room.isActive = true;
    await this.roomRepository.save(room);

    return room;
  }

  async updateRoomMaxParticipants(id: string, maxParticipants: number) {
    const room = await this.roomRepository.findOne({ where: { id } });
    
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    if (maxParticipants < 2 || maxParticipants > 100) {
      throw new Error('Max participants must be between 2 and 100');
    }

    room.maxParticipants = maxParticipants;
    await this.roomRepository.save(room);

    return room;
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    roomId?: string,
    action?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (roomId) {
      where.roomId = roomId;
    }

    if (action) {
      where.action = action;
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { timestamp: 'DESC' },
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const totalRooms = await this.roomRepository.count();
    const activeRooms = await this.roomRepository.count({
      where: { isActive: true },
    });

    const activeParticipants = await this.participantRepository.count({
      where: { leftAt: IsNull() },
    });

    const recentLogs = await this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: 10,
    });

    return {
      totalUsers,
      totalRooms,
      activeRooms,
      activeParticipants,
      recentActivity: recentLogs,
    };
  }

  async getRoomParticipants(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const participants = await this.participantRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });

    return participants;
  }

  async kickParticipant(roomId: string, participantId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, roomId },
    });

    if (!participant) {
      throw new NotFoundException(`Participant not found`);
    }

    participant.leftAt = new Date();
    await this.participantRepository.save(participant);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        roomId,
        actorId: 'admin',
        actorName: 'Admin',
        action: 'KICK_PARTICIPANT',
        targetId: participant.userId,
        targetName: participant.displayName,
        details: 'Participant kicked by admin',
      } as Partial<AuditLogEntity>),
    );
  }

  // Admin user management (UserEntity with ADMIN role)
  async getAdminUsers() {
    const adminUsers = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return adminUsers;
  }

  async createAdminUser(data: { username: string; password: string; name: string; email?: string }) {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const adminUser = this.userRepository.create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await this.userRepository.save(adminUser);

    return {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    };
  }

  async updateAdminUser(id: string, data: Partial<UserEntity>) {
    const user = await this.userRepository.findOne({ where: { id, role: UserRole.ADMIN } });
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.userRepository.update(id, data);
    
    return this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'name', 'username', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async deleteAdminUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id, role: UserRole.ADMIN } });
    
    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    await this.participantRepository.delete({ userId: id });
    await this.userRepository.delete(id);
  }
}
