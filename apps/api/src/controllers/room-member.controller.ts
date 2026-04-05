import { Controller, Post, Delete, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RoomMemberService } from '../services/room-member.service';

@Controller('room-members')
export class RoomMemberController {
  constructor(private readonly roomMemberService: RoomMemberService) {}

  @Post(':roomId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('roomId') roomId: string,
    @Body() body: { userId: string },
  ) {
    return this.roomMemberService.addMemberToRoom(roomId, body.userId);
  }

  @Post(':roomId/members/bulk')
  @HttpCode(HttpStatus.CREATED)
  async addMultipleMembers(
    @Param('roomId') roomId: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.roomMemberService.addMultipleMembersToRoom(roomId, body.userIds);
  }

  @Delete(':roomId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.roomMemberService.removeMemberFromRoom(roomId, userId);
  }

  @Get(':roomId/members')
  async getRoomMembers(@Param('roomId') roomId: string) {
    return this.roomMemberService.getRoomMembers(roomId);
  }

  @Get('users/:userId/rooms')
  async getUserRooms(@Param('userId') userId: string) {
    return this.roomMemberService.getUserRooms(userId);
  }

  @Get(':roomId/members/:userId/check')
  async checkMembership(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    const isMember = await this.roomMemberService.isMemberOfRoom(roomId, userId);
    return { isMember };
  }
}
