import { Controller, Get, Patch, Body, Param, UseGuards, Delete, Post, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  getMyProfile(@User('userId') currentUserId: number) {
    return this.userService.findPrivateProfile(currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User('userId') currentUserId: number) {
    if (+id !== currentUserId) throw new UnauthorizedException('Access denied');
    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Get(':id/roles')
  getRoles(@Param('id') id: string) {
    return this.userService.getUserRoles(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Post(':id/roles')
  addRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.addRole(+id, role as UserRoleType);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @Delete(':id/roles/:role')
  removeRole(@Param('id') id: string, @Param('role') role: string) {
    return this.userService.removeRole(+id, role as UserRoleType);
  }

  @Get(':id/rating')
  getRating(@Param('id') id: string) {
    return this.userService.getAvgRating(+id);
  }
}
