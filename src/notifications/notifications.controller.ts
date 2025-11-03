import { Controller, Get, Param, Patch, Body, Query, UseGuards, HttpCode, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SearchNotificationsDto } from './dto/search-notifications.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() createDto: CreateNotificationDto, @User('userId') userId: number) {
    return this.notificationsService.create(createDto, userId);
  }

  @Get()
  findAll(@Query() searchDto: SearchNotificationsDto, @User('userId') userId: number) {
    return this.notificationsService.findAll(searchDto, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('userId') userId: number) {
    return this.notificationsService.findOne(+id, userId);
  }

  @Patch(':id/read')
  @HttpCode(204)
  markAsRead(@Param('id') id: string, @Body() markAsReadDto: MarkAsReadDto, @User('userId') userId: number) {
    return this.notificationsService.markAsRead(+id, userId, markAsReadDto);
  }
}
