import { Controller, Get, Delete, Patch, Param, Body, HttpCode, HttpStatus, Query, Put, Post } from '@nestjs/common';
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

  @Patch('rooms/:id/max-participants')
  async updateRoomMaxParticipants(
    @Param('id') id: string,
    @Body('maxParticipants') maxParticipants: number,
  ) {
    return this.adminService.updateRoomMaxParticipants(id, maxParticipants);
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

  // Admin Users (UserEntity with ADMIN role)
  @Get('admin-users')
  async getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  @Post('admin-users')
  @HttpCode(HttpStatus.CREATED)
  async createAdminUser(@Body() data: { username: string; password: string; name: string; email?: string }) {
    return this.adminService.createAdminUser(data);
  }

  @Put('admin-users/:id')
  async updateAdminUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAdminUser(id, data);
  }

  @Delete('admin-users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdminUser(@Param('id') id: string) {
    return this.adminService.deleteAdminUser(id);
  }
}
