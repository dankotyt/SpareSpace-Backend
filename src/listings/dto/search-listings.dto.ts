import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, Max, IsObject } from 'class-validator';

import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';
import { ListingType } from '../../common/enums/listing-type.enum';

export class SearchListingsDto {
  @ApiPropertyOptional({ enum: ListingType, description: 'Тип объявления' })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({ enum: CurrencyType, description: 'Валюта' })
  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Минимальная цена' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Максимальная цена' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ListingPeriodType, description: 'Период ценообразования' })
  @IsOptional()
  @IsEnum(ListingPeriodType)
  pricePeriod?: ListingPeriodType;

  @ApiPropertyOptional({ type: Number, minimum: -90, maximum: 90, description: 'Широта' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ type: Number, minimum: -180, maximum: 180, description: 'Долгота' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, description: 'Радиус поиска в метрах' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Удобства в формате {"key": "value"}',
  })
  @IsOptional()
  @IsObject()
  amenities?: Record<string, string>;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 10, description: 'Лимит записей' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0, description: 'Смещение' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;
}
