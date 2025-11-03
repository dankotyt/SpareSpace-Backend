import { IsInt, IsDateString, IsDate, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsInt()
  listingId: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
