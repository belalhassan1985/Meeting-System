import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminEntity } from '../entities/admin.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminEntity)
    private adminRepository: Repository<AdminEntity>,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
      },
    };
  }

  async register(data: { username: string; password: string; fullName: string }) {
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: data.username },
    });

    if (existingAdmin) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const admin = this.adminRepository.create({
      username: data.username,
      password: hashedPassword,
      fullName: data.fullName,
    });

    await this.adminRepository.save(admin);

    return {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const admin = await this.adminRepository.findOne({ where: { id: decoded.id } });

      if (!admin || !admin.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        admin: {
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
        },
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async getAllAdmins() {
    const admins = await this.adminRepository.find({
      select: ['id', 'username', 'fullName', 'isActive', 'createdAt'],
    });
    return admins;
  }

  async updateAdmin(id: string, data: Partial<AdminEntity>) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.adminRepository.update(id, data);
    
    return this.adminRepository.findOne({ 
      where: { id },
      select: ['id', 'username', 'fullName', 'isActive', 'createdAt'],
    });
  }

  async deleteAdmin(id: string) {
    await this.adminRepository.delete(id);
  }
}
