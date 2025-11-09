import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsDate,
  Min,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';

import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';
import { ListingType } from '../../common/enums/listing-type.enum';

export class AvailabilityPeriodDto {
  @ApiProperty({ type: Date, description: 'Дата начала доступности' })
  @Type(() => Date)
  @IsDate()
  start: Date;

  @ApiProperty({ type: Date, description: 'Дата окончания доступности' })
  @Type(() => Date)
  @IsDate()
  end: Date;
}

export class CreateListingDto {
  @ApiProperty({ enum: ListingType, description: 'Тип объявления' })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({ description: 'Заголовок объявления', minLength: 1 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Описание объявления' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ description: 'Цена за период', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    enum: ListingPeriodType,
    default: ListingPeriodType.HOUR,
    description: 'Период ценообразования',
  })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType = ListingPeriodType.HOUR;

  @ApiProperty({ enum: CurrencyType, default: CurrencyType.RUB, description: 'Валюта' })
  @IsEnum(CurrencyType)
  currency: CurrencyType = CurrencyType.RUB;

  @ApiPropertyOptional({ description: 'Широта', minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Долгота', minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ description: 'Физический адрес' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Размер в квадратных метрах', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({ type: [String], description: 'Массив URL фотографий' })
  @IsOptional()
  @IsArray()
  photosJson?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Удобства в формате {"key": "value"}',
  })
  @IsOptional()
  @IsObject()
  amenities?: Record<string, string>;

  @ApiPropertyOptional({ type: [AvailabilityPeriodDto], description: 'Периоды доступности' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityPeriodDto)
  availability?: AvailabilityPeriodDto[];
}
