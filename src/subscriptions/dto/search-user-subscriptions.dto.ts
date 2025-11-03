import { IsOptional, IsEnum, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

export class SearchUserSubscriptionsDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
