import { z } from 'zod';
import { UserRole } from './types';

export const createRoomSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  maxParticipants: z.number().min(2).max(50).default(25),
  hostName: z.string().min(2).max(50),
  userId: z.string().optional(),
});

export const joinRoomSchema = z.object({
  roomId: z.string().uuid(),
  userName: z.string().min(2).max(50),
  userId: z.string().optional(),
});

export const hostActionSchema = z.object({
  type: z.enum(['MUTE_USER', 'DISABLE_CAMERA', 'KICK_USER', 'LOCK_ROOM', 'PROMOTE_USER', 'DEMOTE_USER']),
  targetUserId: z.string(),
  reason: z.string().optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const updateMediaStateSchema = z.object({
  isMuted: z.boolean().optional(),
  isCameraOff: z.boolean().optional(),
  isScreenSharing: z.boolean().optional(),
  isHandRaised: z.boolean().optional(),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type JoinRoomDto = z.infer<typeof joinRoomSchema>;
export type HostActionDto = z.infer<typeof hostActionSchema>;
export type ChatMessageDto = z.infer<typeof chatMessageSchema>;
export type UpdateMediaStateDto = z.infer<typeof updateMediaStateSchema>;
