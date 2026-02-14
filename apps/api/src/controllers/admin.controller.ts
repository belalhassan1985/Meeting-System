import { Controller, Get, Delete, Patch, Param, Body, HttpCode, HttpStatus, Query, Put } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Get('users')
  async getAllUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('rooms')
  async getAllRooms(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getAllRooms(page, limit);
  }

  @Delete('rooms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(@Param('id') id: string) {
    return this.adminService.deleteRoom(id);
  }

  @Patch('rooms/:id/close')
  async closeRoom(@Param('id') id: string) {
    return this.adminService.closeRoom(id);
  }

  @Patch('rooms/:id/reopen')
  async reopenRoom(@Param('id') id: string) {
    return this.adminService.reopenRoom(id);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('roomId') roomId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit, roomId, action);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('rooms/:id/participants')
  async getRoomParticipants(@Param('id') roomId: string) {
    return this.adminService.getRoomParticipants(roomId);
  }

  @Delete('rooms/:roomId/participants/:participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async kickParticipant(
    @Param('roomId') roomId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.adminService.kickParticipant(roomId, participantId);
  }

  @Get('admins')
  async getAllAdmins() {
    return this.authService.getAllAdmins();
  }

  @Put('admins/:id')
  async updateAdmin(@Param('id') id: string, @Body() data: any) {
    return this.authService.updateAdmin(id, data);
  }

  @Delete('admins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdmin(@Param('id') id: string) {
    return this.authService.deleteAdmin(id);
  }
}
