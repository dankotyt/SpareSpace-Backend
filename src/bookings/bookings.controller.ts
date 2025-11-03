import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtLeastOneFieldPipe } from './pipes/at-least-one-field.pipe';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() createBookingDto: CreateBookingDto, @User('userId') userId: number) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  findAll(@Query() searchDto: SearchBookingsDto, @User('userId') userId: number) {
    return this.bookingsService.findAll(searchDto, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(AtLeastOneFieldPipe) updateBookingDto: UpdateBookingDto, @User('userId') userId: number) {
    return this.bookingsService.update(+id, updateBookingDto, userId);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto, @User('userId') userId: number) {
    return this.bookingsService.changeStatus(+id, changeStatusDto.status, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('userId') userId: number) {
    return this.bookingsService.remove(+id, userId);
  }
}
