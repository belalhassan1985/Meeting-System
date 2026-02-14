import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { LiveKitService } from '../services/livekit.service';
import { UserRole, HostActionDto, ChatMessageDto, UpdateMediaStateDto } from '@arabic-meet/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  roomId?: string;
  userRole?: UserRole;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/rooms',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private roomService: RoomService,
    private livekitService: LiveKitService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    if (client.roomId && client.userId) {
      await this.roomService.leaveRoom(client.roomId, client.userId);
      
      this.server.to(client.roomId).emit('room:presence', {
        type: 'leave',
        userId: client.userId,
        userName: client.userName,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; userId: string; userName: string; userRole: UserRole },
  ) {
    const { roomId, userId, userName, userRole } = data;

    client.userId = userId;
    client.userName = userName;
    client.roomId = roomId;
    client.userRole = userRole;

    await client.join(roomId);

    const participants = await this.roomService.getParticipants(roomId);

    this.server.to(roomId).emit('room:presence', {
      type: 'join',
      userId,
      userName,
      userRole,
      timestamp: new Date(),
    });

    client.emit('room:joined', {
      roomId,
      participants,
    });

    this.logger.log(`User ${userName} joined room ${roomId}`);
  }

  @SubscribeMessage('room:chat')
  async handleChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: ChatMessageDto,
  ) {
    if (!client.roomId || !client.userId) {
      return;
    }

    const chatMessage = {
      id: Date.now().toString(),
      roomId: client.roomId,
      userId: client.userId,
      userName: client.userName,
      message: data.message,
      timestamp: new Date(),
    };

    this.server.to(client.roomId).emit('room:chat', chatMessage);
  }

  @SubscribeMessage('room:mediaUpdate')
  async handleMediaUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: UpdateMediaStateDto,
  ) {
    if (!client.roomId || !client.userId) {
      return;
    }

    await this.roomService.updateParticipantMedia(client.roomId, client.userId, data);

    this.server.to(client.roomId).emit('room:participantUpdate', {
      userId: client.userId,
      updates: data,
    });
  }

  @SubscribeMessage('room:hostAction')
  async handleHostAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: HostActionDto,
  ) {
    if (!client.roomId || !client.userId) {
      return { success: false, error: 'Not in a room' };
    }

    if (client.userRole !== UserRole.HOST && client.userRole !== UserRole.COHOST) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const { type, targetUserId, reason } = data;

      switch (type as 'MUTE_USER' | 'DISABLE_CAMERA' | 'KICK_USER' | 'LOCK_ROOM' | 'UNLOCK_ROOM' | 'PROMOTE_USER' | 'DEMOTE_USER') {
        case 'MUTE_USER':
          await this.livekitService.muteParticipant(client.roomId, targetUserId);
          await this.roomService.updateParticipantMedia(client.roomId, targetUserId, {
            isMuted: true,
          });
          
          this.server.to(client.roomId).emit('room:hostAction', {
            type: 'FORCE_MUTE',
            targetUserId,
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'MUTE_USER',
            targetUserId,
            null,
            reason || 'Muted by host',
          );
          break;

        case 'DISABLE_CAMERA':
          await this.roomService.updateParticipantMedia(client.roomId, targetUserId, {
            isCameraOff: true,
          });
          
          this.server.to(client.roomId).emit('room:hostAction', {
            type: 'FORCE_CAMERA_OFF',
            targetUserId,
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'DISABLE_CAMERA',
            targetUserId,
            null,
            reason || 'Camera disabled by host',
          );
          break;

        case 'KICK_USER':
          await this.livekitService.removeParticipant(client.roomId, targetUserId);
          await this.roomService.leaveRoom(client.roomId, targetUserId);
          
          this.server.to(client.roomId).emit('room:hostAction', {
            type: 'KICK',
            targetUserId,
            actorName: client.userName,
          });

          const targetSockets = await this.server.in(client.roomId).fetchSockets();
          const targetSocket = targetSockets.find(
            (s: any) => s.userId === targetUserId,
          );
          if (targetSocket) {
            targetSocket.emit('room:kicked', { reason });
            targetSocket.leave(client.roomId);
          }

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'KICK_USER',
            targetUserId,
            null,
            reason || 'Kicked by host',
          );
          break;

        case 'LOCK_ROOM':
          await this.roomService.lockRoom(client.roomId, true);
          
          this.server.to(client.roomId).emit('room:locked', {
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'LOCK_ROOM',
            null,
            null,
            'Room locked',
          );
          break;

        case 'UNLOCK_ROOM':
          await this.roomService.lockRoom(client.roomId, false);
          
          this.server.to(client.roomId).emit('room:unlocked', {
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'UNLOCK_ROOM',
            null,
            null,
            'Room unlocked',
          );
          break;

        case 'PROMOTE_USER':
          await this.roomService.promoteParticipant(
            client.roomId,
            targetUserId,
            UserRole.COHOST,
          );
          
          this.server.to(client.roomId).emit('room:hostAction', {
            type: 'PROMOTE',
            targetUserId,
            newRole: UserRole.COHOST,
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'PROMOTE_COHOST',
            targetUserId,
            null,
            'Promoted to co-host',
          );
          break;

        case 'DEMOTE_USER':
          await this.roomService.promoteParticipant(
            client.roomId,
            targetUserId,
            UserRole.PARTICIPANT,
          );
          
          this.server.to(client.roomId).emit('room:hostAction', {
            type: 'DEMOTE',
            targetUserId,
            newRole: UserRole.PARTICIPANT,
            actorName: client.userName,
          });

          await this.roomService.createAuditLog(
            client.roomId,
            client.userId,
            client.userName || 'Unknown',
            'DEMOTE_USER',
            targetUserId,
            null,
            'Demoted to participant',
          );
          break;
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Host action failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('room:raiseHand')
  async handleRaiseHand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { raised: boolean },
  ) {
    if (!client.roomId || !client.userId) {
      return;
    }

    await this.roomService.updateParticipantMedia(client.roomId, client.userId, {
      isHandRaised: data.raised,
    });

    this.server.to(client.roomId).emit('room:handRaised', {
      userId: client.userId,
      userName: client.userName,
      raised: data.raised,
    });
  }
}
