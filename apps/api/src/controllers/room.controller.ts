import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { RoomMemberService } from '../services/room-member.service';
import { CreateRoomDto, JoinRoomDto } from '@arabic-meet/shared';

@Controller('rooms')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly roomMemberService: RoomMemberService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto);
  }

  @Get()
  async getRooms(@Query('userId') userId?: string) {
    if (userId) {
      // إرجاع الغرف المسجل فيها المستخدم فقط
      return this.roomMemberService.getUserRooms(userId);
    }
    // إرجاع جميع الغرف (للمسؤولين)
    return this.roomService.getRooms();
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    return this.roomService.getRoom(id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinRoom(@Param('id') roomId: string, @Body() joinRoomDto: JoinRoomDto) {
    return this.roomService.joinRoom({ ...joinRoomDto, roomId });
  }

  @Get(':id/participants')
  async getParticipants(@Param('id') roomId: string) {
    return this.roomService.getParticipants(roomId);
  }
}
