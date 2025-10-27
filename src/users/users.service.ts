import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
  ) {}

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'first_name', 'last_name', 'patronymic', 'rating', 'created_at', 'verified', 'created_at']
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      rating: user.rating || 0
    };
  }

  async findPrivateProfile(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'phone', 'first_name', 'last_name', 'patronymic', 'rating', 'two_fa_enabled', 'verified', 'created_at', 'updated_at']
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      rating: user.rating || 0
    };
  }

  getFullName(user: User): string {
    return `${user.first_name} ${user.last_name} ${user.patronymic || ''}`.trim();
  }

  async findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findPrivateProfile(id);
    Object.assign(user, dto);
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