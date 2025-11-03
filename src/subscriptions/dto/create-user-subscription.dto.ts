import { IsInt, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class CreateUserSubscriptionDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  planId: number;
}
