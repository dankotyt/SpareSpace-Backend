import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
  ) {}

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'patronymic', 'rating', 'verified', 'createdAt']
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findPrivateProfile(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'phone', 'firstName', 'lastName', 'patronymic', 'rating', 'twoFaEnabled', 'verified', 'createdAt', 'updatedAt'] // все приватные поля
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  
  async update(userId: number, dto: UpdateUserDto) {
    const user = await this.findPrivateProfile(userId);
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.patronymic !== undefined) user.patronymic = dto.patronymic;
    if (dto.phone !== undefined) user.phone = dto.phone;
    
    if (await this.hasRole(userId, UserRoleType.ADMIN)) {
        if (dto.verified !== undefined) user.verified = dto.verified;
        if (dto.twoFaEnabled !== undefined) user.twoFaEnabled = dto.twoFaEnabled;
    }
    return this.userRepository.save(user);
  }

  async getUserRoles(id: number) {
    const roles = await this.userRoleRepository.find({
      where: { user: { id } },
      select: ['role'],
    });
    return roles.map(r => r.role);
  }

  async addRole(id: number, role: UserRoleType) {
    const existing = await this.userRoleRepository.findOneBy({ user: { id }, role  });
    if (existing) return;

    const userRole = this.userRoleRepository.create({ user: { id }, role });
    await this.userRoleRepository.save(userRole);
  }

  async removeRole(id: number, role: UserRoleType) {
    await this.userRoleRepository.delete({ user: { id }, role });
  }

  async getAvgRating(id: number) {
    const user = await this.findById(id);
    return user.rating || 0;
  }

  async hasRole(userId: number, requiredRole: UserRoleType) {
    const roles = await this.getUserRoles(userId);
    return roles.includes(requiredRole);
  }
}