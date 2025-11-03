import { IsOptional, IsString, IsEnum, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class SearchSubscriptionPlansDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

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
