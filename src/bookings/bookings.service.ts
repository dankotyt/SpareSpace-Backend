import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Listing } from '../entities/listing.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Listing) private listingRepository: Repository<Listing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private userService: UsersService,
  ) {}

  private async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async validateRenterRole(user: User): Promise<void> {
    const hasRenter = await this.userService.hasRole(user.id, UserRoleType.RENTER);
    if (!hasRenter) throw new UnauthorizedException('Only renters can create bookings');
  }

  private async validateLandlordOwnership(booking: Booking, userId: number): Promise<void> {
    const hasLandlord = await this.userService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlord || booking.listing.user.id !== userId) {
      throw new UnauthorizedException('Not authorized to modify this booking');
    }
  }

  private calculateDuration(start: Date, end: Date, pricePeriod: string): number {
    const durationMs = end.getTime() - start.getTime();
    
    switch (pricePeriod) {
      case 'HOUR':
        return Math.ceil(durationMs / (1000 * 60 * 60));
      case 'DAY':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      case 'WEEK':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
      case 'MONTH':
        return Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30));  // примерно
      default:
        throw new BadRequestException('Invalid price period');
    }
  }

  private parseTsRange(startDate: Date, endDate: Date): string {
    return `[${startDate.toISOString()},${endDate.toISOString()})`;
  }

  private async checkListingAvailability(listingId: number, start: Date, end: Date, excludeBookingId?: number) {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.listing_id = :listingId', { listingId })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED] 
      })
      .andWhere('booking.period && tsrange(:start, :end)', { start, end });

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const overlapping = await query.getOne();
    return !overlapping;
  }

  async create(dto: CreateBookingDto, userId: number): Promise<Booking> {
    if (dto.startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('End date cannot be before start date ');
    }

    const user = await this.validateUser(userId);
    await this.validateRenterRole(user);

    const listing = await this.listingRepository.findOne({ 
      where: { id: dto.listingId, status: ListingStatus.ACTIVE },
      relations: ['user']
    });
    
    if (!listing) {
      throw new BadRequestException('Invalid or inactive listing');
    }

    const isAvailable = await this.checkListingAvailability(listing.id, dto.startDate, dto.endDate);
    if (!isAvailable) {
      throw new ConflictException('Listing not available for selected period');
    }

    const duration = this.calculateDuration(dto.startDate, dto.endDate, listing.pricePeriod);
    const priceTotal = Math.round(listing.price * duration * 100) / 100;

    const booking = this.bookingRepository.create({
      listing: listing,
      renter: user,
      period: this.parseTsRange(dto.startDate, dto.endDate),
      priceTotal: priceTotal,
      currency: listing.currency,
      status: BookingStatus.PENDING,
    });

    return await this.bookingRepository.save(booking);
  }

  async findAll(searchDto: SearchBookingsDto, userId: number) {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.listing', 'listing')
      .leftJoinAndSelect('booking.renter', 'renter')
      .leftJoinAndSelect('listing.user', 'landlord')
      .where('(booking.renter.id = :userId OR listing.user.id = :userId)', { userId });

    if (searchDto.status) {
      query.andWhere('booking.status = :status', { status: searchDto.status });
    }

    const [bookings, total] = await query
      .orderBy('booking.created_at', 'DESC')
      .limit(searchDto.limit)
      .offset(searchDto.offset)
      .getManyAndCount();

    return { bookings, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['listing', 'renter', 'listing.user'],
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    
    return booking;
  }

  async update(id: number, dto: UpdateBookingDto, userId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    
    if (booking.renter.id !== userId) throw new UnauthorizedException('Only renter can update this booking');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Only pending bookings can be updated');

    const bookingWithPeriod = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.*')
      .addSelect('LOWER(booking.period)', 'periodStart')
      .addSelect('UPPER(booking.period)', 'periodEnd')
      .where('booking.id = :id', { id })
      .getRawOne();

    const start_date = dto.startDate ?? new Date(bookingWithPeriod.periodStart);
    const end_date = dto.endDate ?? new Date(bookingWithPeriod.periodEnd);

    if (start_date < new Date()) throw new BadRequestException('Start date cannot be in the past');
    if (end_date <= start_date) throw new BadRequestException('End date cannot be before start date');

    const isAvailable = await this.checkListingAvailability(booking.listing.id, start_date, end_date, id);
    if (!isAvailable) throw new ConflictException('Listing not available for selected period');

    booking.period = this.parseTsRange(start_date, end_date);
    const duration = this.calculateDuration(start_date, end_date, booking.listing.pricePeriod);
    booking.priceTotal = booking.listing.price * duration;

    return this.bookingRepository.save(booking);
  }

  async changeStatus(id: number, newStatus: BookingStatus, userId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    await this.validateLandlordOwnership(booking, userId);

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot change completed or cancelled booking');
    }

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async remove(id: number, userId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    
    if (booking.renter.id !== userId && booking.listing.user.id !== userId) {
      throw new UnauthorizedException('Not authorized to cancel this booking');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
