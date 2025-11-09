import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID пользователя' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Email пользователя', format: 'email' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Телефон пользователя' })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({ description: 'Хэш пароля' })
  @Column()
  passwordHash: string;

  @ApiProperty({ description: 'Имя' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'Фамилия' })
  @Column()
  lastName: string;

  @ApiPropertyOptional({ description: 'Отчество' })
  @Column()
  patronymic?: string;

  @ApiPropertyOptional({ description: 'Рейтинг пользователя', minimum: 0, maximum: 5 })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @ApiProperty({ description: 'Включена ли двухфакторная аутентификация', default: false })
  @Column({ default: false })
  twoFaEnabled: boolean;

  @ApiProperty({ description: 'Верифицирован ли пользователь', default: false })
  @Column({ default: false })
  verified: boolean;

  @ApiProperty({ description: 'Дата создания', type: Date })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления', type: Date })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ApiProperty({ type: () => UserRole, isArray: true, description: 'Роли пользователя' })
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  get roles(): UserRoleType[] {
    return this.userRoles?.map((userRole) => userRole.role) || [];
  }
}
