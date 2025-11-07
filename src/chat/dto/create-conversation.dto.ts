import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  participantId: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  listingId?: number;
}
