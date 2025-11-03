import { IsString, IsNotEmpty, IsNumber, IsPositive, IsBoolean, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'Maximum listings must be positive' })
  maxListings: number;

  @IsBoolean()
  prioritySearch: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'Boosts per month must be positive' })
  boostsPerMonth: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extraFeatures?: Record<string, any>;
}
