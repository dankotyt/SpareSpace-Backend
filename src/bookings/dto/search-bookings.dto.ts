import { IsInt, IsEnum, IsOptional, Min, IsPositive } from 'class-validator';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Type } from 'class-transformer';

export class SearchBookingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
