import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomMemberEntity } from '../entities/room-member.entity';
import { RoomEntity } from '../entities/room.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class RoomMemberService {
  constructor(
    @InjectRepository(RoomMemberEntity)
    private roomMemberRepository: Repository<RoomMemberEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async addMemberToRoom(roomId: string, userId: string) {
    // التحقق من وجود الغرفة
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('الغرفة غير موجودة');
    }

    // التحقق من وجود المستخدم
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // التحقق من عدم وجود عضوية مسبقة
    const existingMember = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (existingMember) {
      throw new ConflictException('المستخدم مسجل بالفعل في هذه الغرفة');
    }

    // إضافة العضو
    const member = this.roomMemberRepository.create({
      roomId,
      userId,
    });

    await this.roomMemberRepository.save(member);

    return {
      message: 'تم إضافة المستخدم إلى الغرفة بنجاح',
      member: {
        id: member.id,
        roomId: member.roomId,
        userId: member.userId,
        joinedAt: member.joinedAt,
      },
    };
  }

  async removeMemberFromRoom(roomId: string, userId: string) {
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (!member) {
      throw new NotFoundException('العضوية غير موجودة');
    }

    await this.roomMemberRepository.remove(member);

    return {
      message: 'تم إزالة المستخدم من الغرفة بنجاح',
    };
  }

  async getRoomMembers(roomId: string) {
    const members = await this.roomMemberRepository.find({
      where: { roomId },
      relations: ['user'],
    });

    return members.map(member => ({
      id: member.id,
      userId: member.user.id,
      username: member.user.username,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.joinedAt,
    }));
  }

  async getUserRooms(userId: string) {
    const memberships = await this.roomMemberRepository.find({
      where: { userId },
      relations: ['room'],
    });

    return memberships.map(membership => ({
      id: membership.room.id,
      name: membership.room.name,
      description: membership.room.description,
      isActive: membership.room.isActive,
      maxParticipants: membership.room.maxParticipants,
      createdAt: membership.room.createdAt,
      joinedAt: membership.joinedAt,
    }));
  }

  async isMemberOfRoom(roomId: string, userId: string): Promise<boolean> {
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    return !!member;
  }

  async addMultipleMembersToRoom(roomId: string, userIds: string[]) {
    const results: {
      success: string[];
      failed: Array<{ userId: string; error: string }>;
    } = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        await this.addMemberToRoom(roomId, userId);
        results.success.push(userId);
      } catch (error: any) {
        results.failed.push({ userId, error: error.message });
      }
    }

    return results;
  }
}
