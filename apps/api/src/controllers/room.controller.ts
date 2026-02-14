import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { CreateRoomDto, JoinRoomDto } from '@arabic-meet/shared';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto);
  }

  @Get()
  async getRooms() {
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
