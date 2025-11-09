import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import type { Point } from 'geojson';

import { UsersService } from '../users/users.service';
import { Listing } from '../entities/listing.entity';
import { User } from '../entities/user.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

import { CreateListingDto } from './dto/create-listing.dto';
import { AvailabilityPeriodDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepository: Repository<ViewHistory>,
    private readonly userService: UsersService,
  ) {}

  /**
   * Validates the existence of a user by ID.
   * @param userId - The ID of the user to validate.
   * @throws UnauthorizedException if user not found.
   */
  private async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Validates ownership of a listing by user ID.
   * @param listingId - The listing ID.
   * @param userId - The user ID to check ownership.
   * @returns The owned listing entity.
   * @throws UnauthorizedException if not owned.
   */
  private async validateListingOwnership(listingId: number, userId: number): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, user: { id: userId } },
      relations: ['user'],
    });
    if (!listing) {
      throw new UnauthorizedException('Not authorized to modify this listing');
    }
    return listing;
  }

  /**
   * Prepares partial data for listing creation or update.
   * @param dto - The DTO.
   * @param baseData - Base entity data (user for create, existing listing for update).
   * @returns Prepared data object.
   */
  private prepareListingData(
    dto: CreateListingDto | UpdateListingDto,
    baseData: Partial<Listing> | Listing,
  ): Partial<Listing> {
    const data: Partial<Listing> = { ...baseData };

    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.pricePeriod !== undefined) data.pricePeriod = dto.pricePeriod;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.size !== undefined) data.size = dto.size;
    if (dto.photosJson !== undefined) data.photosJson = dto.photosJson;
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      data.location = {
        type: 'Point' as const,
        coordinates: [dto.longitude, dto.latitude] as [number, number],
      } as Point;
    }
    if (dto.amenities !== undefined) {
      if (typeof dto.amenities === 'object') {
        data.amenities = dto.amenities;
      } else if (typeof dto.amenities === 'string') {
        try {
          data.amenities = JSON.parse(dto.amenities) as Record<string, string>;
        } catch {
          data.amenities = null;
        }
      } else {
        data.amenities = null;
      }
    }
    if (dto.availability !== undefined) {
      data.availability = dto.availability
        .filter((interval): interval is AvailabilityPeriodDto => interval.start < interval.end)
        .map((interval) => `[${interval.start.toISOString()},${interval.end.toISOString()})`);
    }

    return data;
  }

  /**
   * Builds a query with search filters for listings.
   * @param searchDto - The search DTO.
   * @param allowedStatuses - Statuses of listings to be found.
   * @param targetUserId - Optional user ID to filter listings by specific owner.
   * @returns The configured query builder.
   */
  private buildSearchQuery(
    searchDto: SearchListingsDto,
    allowedStatuses: ListingStatus[],
    targetUserId?: number,
  ): SelectQueryBuilder<Listing> {
    const query = this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.status IN (:...statuses)', { statuses: allowedStatuses })
      .leftJoinAndSelect('listing.user', 'user');

    if (targetUserId !== undefined) {
      query.andWhere('listing.user_id = :targetUserId', { targetUserId });
    }
    if (searchDto.type !== undefined) {
      query.andWhere('listing.type = :type', { type: searchDto.type });
    }
    if (searchDto.currency !== undefined) {
      query.andWhere('listing.currency = :currency', { currency: searchDto.currency });
    }
    if (searchDto.minPrice !== undefined) {
      query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    }
    if (searchDto.maxPrice !== undefined) {
      query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    }
    if (searchDto.pricePeriod !== undefined) {
      query.andWhere('listing.price_period = :pricePeriod', { pricePeriod: searchDto.pricePeriod });
    }
    if (
      searchDto.latitude !== undefined &&
      searchDto.longitude !== undefined &&
      searchDto.radius !== undefined
    ) {
      query.andWhere(
        'ST_DWithin(listing.location::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)',
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius },
      );
    }
    if (searchDto.amenities !== undefined) {
      let amenitiesObj: Record<string, string>;
      if (typeof searchDto.amenities === 'object') {
        amenitiesObj = searchDto.amenities;
      } else if (typeof searchDto.amenities === 'string') {
        try {
          amenitiesObj = JSON.parse(searchDto.amenities) as Record<string, string>;
        } catch {
          return query;
        }
      } else {
        return query;
      }
      if (Object.keys(amenitiesObj).length > 0) {
        Object.entries(amenitiesObj).forEach(([key, value]) => {
          const paramName = `value_${key.replace(/\W/g, '_')}`;
          query.andWhere(`listing.amenities ->> '${key}' = :${paramName}`, {
            [paramName]: String(value),
          });
        });
      }
    }
    query.orderBy('listing.created_at', 'DESC').limit(searchDto.limit).offset(searchDto.offset);

    return query;
  }

  /**
   * Creates a new listing.
   * @param dto - The creation DTO.
   * @param userId - The ID of the creating user.
   * @returns The saved listing entity.
   */
  async create(dto: CreateListingDto, userId: number): Promise<Listing> {
    const user = await this.validateUser(userId);
    const listingData = this.prepareListingData(dto, { user });
    const listing = this.listingRepository.create(listingData);
    await this.userService.addRole(userId, UserRoleType.LANDLORD);
    return this.listingRepository.save(listing);
  }

  /**
   * Updates an existing listing.
   * @param listingId - The listing ID.
   * @param dto - The update DTO.
   * @param userId - The updating user ID.
   * @returns The saved listing entity.
   */
  async update(listingId: number, dto: UpdateListingDto, userId: number): Promise<Listing> {
    const listing = await this.validateListingOwnership(listingId, userId);
    const updatedData = this.prepareListingData(dto, listing);
    const updatedListing = this.listingRepository.create(updatedData);
    return this.listingRepository.save(updatedListing);
  }

  /**
   * Soft-deletes a listing by setting status to INACTIVE.
   * @param listingId - The listing ID.
   * @param userId - The deleting user ID.
   */
  async remove(listingId: number, userId: number): Promise<void> {
    const listing = await this.validateListingOwnership(listingId, userId);
    listing.status = ListingStatus.INACTIVE;
    await this.listingRepository.save(listing);
  }

  /**
   * Retrieves all listings with search filters.
   * @param searchDto - The search DTO.
   * @returns Paginated listings with metadata.
   */
  async findAll(
    searchDto: SearchListingsDto,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    const allowedStatuses = [ListingStatus.ACTIVE];
    const [listings, total] = await this.buildSearchQuery(
      searchDto,
      allowedStatuses,
    ).getManyAndCount();
    return { listings, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  /**
   * Retrieves a single listing by ID, tracking view if user provided.
   * @param id - The listing ID.
   * @param userId - Optional user ID for listing views tracking.
   * @returns The listing entity.
   * @throws NotFoundException if listing not found or inactive.
   */
  async findOne(id: number, userId?: number): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id, status: ListingStatus.ACTIVE },
      relations: ['user'],
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (userId) {
      await this.viewHistoryRepository.insert({ user: { id: userId }, listing, });
    }
    return listing;
  }

  /**
   * Retrieves listings by user ID with optional filters.
   * @param targetUserId - The owner user ID.
   * @param searchDto - The search DTO.
   * @param currentUserId - Optional current user ID for ownership check.
   * @returns Paginated listings with metadata.
   */
  async findByUser(
    targetUserId: number,
    searchDto: SearchListingsDto,
    currentUserId?: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    await this.validateUser(targetUserId);

    const isOwner = currentUserId === targetUserId;
    const allowedStatuses = isOwner
      ? [ListingStatus.DRAFT, ListingStatus.ACTIVE]
      : [ListingStatus.ACTIVE];

    const [listings, total] = await this.buildSearchQuery(
      searchDto,
      allowedStatuses,
      targetUserId,
    ).getManyAndCount();
    return { listings, total, limit: searchDto.limit, offset: searchDto.offset };
  }
}
