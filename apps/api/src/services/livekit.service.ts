import { Injectable, Logger } from '@nestjs/common';
import { AccessToken, RoomServiceClient, Room } from 'livekit-server-sdk';
import { UserRole } from '@arabic-meet/shared';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;
  private apiKey: string;
  private apiSecret: string;
  private livekitUrl: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    this.livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    
    this.roomService = new RoomServiceClient(
      this.livekitUrl,
      this.apiKey,
      this.apiSecret,
    );
  }

  async createRoom(roomId: string, maxParticipants: number): Promise<Room> {
    try {
      const room = await this.roomService.createRoom({
        name: roomId,
        emptyTimeout: 300,
        maxParticipants: maxParticipants,
      });
      this.logger.log(`Created LiveKit room: ${roomId}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      throw error;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomId);
      this.logger.log(`Deleted LiveKit room: ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to delete room: ${error.message}`);
    }
  }

  async generateToken(
    roomId: string,
    participantId: string,
    participantName: string,
    role: UserRole,
  ): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantId,
      name: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();
    this.logger.log(`Generated token for ${participantName} in room ${roomId}`);
    return token;
  }

  async muteParticipant(roomId: string, participantId: string): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(roomId, participantId, '', true);
      this.logger.log(`Muted participant ${participantId} in room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to mute participant: ${error.message}`);
      throw error;
    }
  }

  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomId, participantId);
      this.logger.log(`Removed participant ${participantId} from room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to remove participant: ${error.message}`);
      throw error;
    }
  }

  async listParticipants(roomId: string) {
    try {
      return await this.roomService.listParticipants(roomId);
    } catch (error) {
      this.logger.error(`Failed to list participants: ${error.message}`);
      return [];
    }
  }

  getLivekitUrl(): string {
    return this.livekitUrl;
  }
}
