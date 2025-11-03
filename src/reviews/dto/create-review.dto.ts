import { IsInt, IsNumber, Min, Max, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  bookingId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;
}
