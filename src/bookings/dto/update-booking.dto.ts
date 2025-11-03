import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookingDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
