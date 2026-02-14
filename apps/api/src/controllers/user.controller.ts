import { Controller, Post, Get, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { username: string; password: string }) {
    console.log('[UserController] Login request received:', { username: loginDto.username });
    return this.userService.login(loginDto.username, loginDto.password);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: { username: string; password: string; name: string; email?: string }) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: Partial<{ username: string; password: string; name: string; email: string; isActive: boolean }>) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Put(':id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    return this.userService.toggleUserStatus(id);
  }

  @Post('fix-roles')
  @HttpCode(HttpStatus.OK)
  async fixRoles() {
    return this.userService.fixRoles();
  }

  @Post('fix-usernames')
  @HttpCode(HttpStatus.OK)
  async fixUsernames() {
    return this.userService.fixNullUsernames();
  }
}
