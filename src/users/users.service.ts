import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch {
      throw new BadRequestException('Failed to fetch users');
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({ where: { email } });
    } catch {
      throw new BadRequestException('Failed to fetch user by email');
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    try {
      // Check if email already exists
      if (userData.email) {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictException(
            `User with email ${userData.email} already exists`,
          );
        }
      }

      const user = this.usersRepository.create(userData);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
      const user = await this.findOne(id);

      // Check if email is being updated and if it conflicts
      if (userData.email && userData.email !== user.email) {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictException(
            `User with email ${userData.email} already exists`,
          );
        }
      }

      Object.assign(user, userData);
      return await this.usersRepository.save(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const user = await this.findOne(id);
      await this.usersRepository.remove(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete user');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({ where: { username } });
    } catch {
      throw new BadRequestException('Failed to fetch user by username');
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    try {
      await this.usersRepository.update(id, { lastLoginAt: new Date() });
    } catch {
      throw new BadRequestException('Failed to update last login');
    }
  }
}
