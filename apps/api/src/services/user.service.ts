import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async login(username: string, password: string) {
    console.log('[UserService] Login attempt:', { username, passwordLength: password?.length });
    
    const user = await this.userRepository.findOne({ where: { username } });
    console.log('[UserService] User found:', user ? { id: user.id, username: user.username, role: user.role, isActive: user.isActive, hasPassword: !!user.password } : 'NOT FOUND');

    if (!user) {
      console.log('[UserService] Login failed: User not found');
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      console.log('[UserService] Login failed: User inactive');
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    console.log('[UserService] Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[UserService] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[UserService] Login failed: Invalid password');
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    console.log('[UserService] Login successful, generating token...');
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('[UserService] Login completed successfully for role:', user.role);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      if (decoded.type !== 'user') {
        return { valid: false };
      }

      const user = await this.userRepository.findOne({ where: { id: decoded.id } });

      if (!user || !user.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'name', 'email', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return users;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'email', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async createUser(data: { username: string; password: string; name: string; email?: string }) {
    const existingUser = await this.userRepository.findOne({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new ConflictException('اسم المستخدم موجود بالفعل');
    }

    if (data.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ConflictException('البريد الإلكتروني موجود بالفعل');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    };
  }

  async updateUser(id: string, data: Partial<UserEntity>) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (data.username && data.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: data.username },
      });

      if (existingUser) {
        throw new ConflictException('اسم المستخدم موجود بالفعل');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.userRepository.update(id, data);
    
    return this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'username', 'name', 'email', 'isActive', 'createdAt'],
    });
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    await this.userRepository.delete(id);
    return { message: 'تم حذف المستخدم بنجاح' };
  }

  async toggleUserStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      isActive: user.isActive,
    };
  }

  async fixRoles() {
    // Update all users: migrate lowercase to uppercase
    const allUsers = await this.userRepository.find();
    
    for (const user of allUsers) {
      let needsUpdate = false;
      
      // Convert 'admin' to 'ADMIN'
      if (user.role === 'admin' as any) {
        user.role = UserRole.ADMIN;
        needsUpdate = true;
      }
      // Convert 'user' to 'USER'
      else if (user.role === 'user' as any) {
        user.role = UserRole.USER;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await this.userRepository.save(user);
      }
    }

    // Return updated users
    const users = await this.userRepository.find({
      select: ['id', 'username', 'name', 'role'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'تم تحديث الأدوار بنجاح',
      users: users.map(u => ({
        name: u.name,
        username: u.username,
        role: u.role,
      })),
    };
  }

  async fixNullUsernames() {
    const allUsers = await this.userRepository.find();
    const updates: Array<{ id: string; name: string; username: string }> = [];

    for (const user of allUsers) {
      if (!user.username) {
        // Generate username from name or ID
        let username = user.name 
          ? user.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)
          : `user_${user.id.substring(0, 8)}`;
        
        // Check if username exists
        const existing = await this.userRepository.findOne({ 
          where: { username } 
        });
        
        if (existing && existing.id !== user.id) {
          username = `${username}_${user.id.substring(0, 4)}`;
        }

        user.username = username;
        updates.push({ id: user.id, name: user.name, username });
        await this.userRepository.save(user);
      }
    }

    return {
      message: 'تم تحديث usernames بنجاح',
      updated: updates.length,
      users: updates,
    };
  }
}
