export enum UserRole {
  HOST = 'HOST',
  COHOST = 'COHOST',
  PARTICIPANT = 'PARTICIPANT',
}

export enum MediaState {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  LOCKED = 'LOCKED',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  maxParticipants: number;
  isLocked: boolean;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  userId: string;
  roomId: string;
  role: UserRole;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export interface HostAction {
  type: 'MUTE_USER' | 'DISABLE_CAMERA' | 'KICK_USER' | 'LOCK_ROOM' | 'UNLOCK_ROOM' | 'PROMOTE_USER' | 'DEMOTE_USER';
  targetUserId: string;
  reason?: string;
}

export interface RoomJoinResponse {
  livekitToken: string;
  livekitUrl: string;
  userRole: UserRole;
  roomInfo: Room;
  participants: Participant[];
}

export interface ConnectionQuality {
  userId: string;
  quality: 'excellent' | 'good' | 'poor';
  latency: number;
  packetLoss: number;
}

export interface AuditLog {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: Date;
}
