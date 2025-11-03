import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  toUserId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  listingId?: number;

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
