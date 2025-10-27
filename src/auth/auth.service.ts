import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { UserToken } from '../entities/user-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly DEFAULT_USER_ROLE = UserRoleType.RENTER;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserToken) private tokenRepository: Repository<UserToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  private getRefreshTokenExpiryMs(): number {
    const days = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    return days * 24 * 60 * 60 * 1000;
  }

  private async checkEmailExists(email: string) {
    const exists = await this.userRepository.findOneBy({ email });
    if (exists) throw new ConflictException('Email already exists');
  }

  private async checkPhoneExists(phone: string) {
    const exists = await this.userRepository.findOneBy({ phone });
    if (exists) throw new ConflictException('Phone already exists');
  }

  async checkPhoneForLogin(phone: string): Promise<{ exists: boolean }> {
    const user = await this.userRepository.findOneBy({ phone });
    return { exists: !!user };
  }

  private async createUser(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email,
      phone: dto.phone,
      password_hash: hash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      patronymic: dto.patronymic,
    });
    return this.userRepository.save(user);
  }

  private async generateTokens(user: User) {
    const roles = await this.userService.getUserRoles(user.id);
    const payload = { sub: user.id, roles };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = crypto.randomBytes(64).toString('base64url');
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.BCRYPT_SALT_ROUNDS);

    return { accessToken, refreshToken, refreshTokenHash };
  }

  private async saveTokens(userId: number, refreshTokenHash: string) {
    await this.tokenRepository.save({
      user: { id: userId },
      refresh_token_hash: refreshTokenHash,
      expiry: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
      revoked: false,
    });
  }

  private async findValidToken(tokens: UserToken[], refreshToken: string) {
    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.refresh_token_hash)) {
        return token;
      }
    }
    return null;
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Пользователь не найден! Проверьте логин или пароль');
    }
    return user;
  }

  async register(dto: RegisterDto) {
    await this.checkEmailExists(dto.email);
    await this.checkPhoneExists(dto.phone);
    const user = await this.createUser(dto);
    await this.userService.addRole(user.id, this.DEFAULT_USER_ROLE);
    const { accessToken, refreshToken, refreshTokenHash } = await this.generateTokens(user);
    await this.saveTokens(user.id, refreshTokenHash);
    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const { accessToken, refreshToken, refreshTokenHash } = await this.generateTokens(user);
    await this.saveTokens(user.id, refreshTokenHash);
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const tokens = await this.tokenRepository.find({
      where: { revoked: false, expiry: MoreThan(new Date()) },
      relations: ['user']
    });
    const validToken = await this.findValidToken(tokens, refreshToken);

    if (!validToken || validToken.expiry < new Date() || validToken.revoked) throw new UnauthorizedException('Invalid or expired token');
    await this.tokenRepository.update(validToken.id, { revoked: true });

    if (!validToken.user) throw new UnauthorizedException('User not found');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, refreshTokenHash: newHash } = await this.generateTokens(validToken.user);
    await this.saveTokens(validToken.user.id, newHash);
    return { newAccessToken, newRefreshToken };
  }

  async logout(refreshToken: string) {
    const tokens = await this.tokenRepository.find({
      where: { revoked: false }
    });
    const validToken = await this.findValidToken(tokens, refreshToken);
    if (validToken) {
      await this.tokenRepository.update(validToken.id, { revoked: true });
    }
  }
}