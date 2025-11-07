import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray, IsDate, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType } from '../../common/enums/listing-type.enum';
import { CurrencyType } from '../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';

export class AvailabilityPeriodDto {
  @Type(() => Date)
  @IsDate()
  start: Date;

  @Type(() => Date)
  @IsDate()
  end: Date;
}

export class CreateListingDto {
  @IsEnum(ListingType)
  type: ListingType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType = ListingPeriodType.HOUR;

  @IsEnum(CurrencyType)
  currency: CurrencyType = CurrencyType.RUB;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @IsOptional()
  @IsArray()
  photosJson?: string[];

  @IsOptional()
  @IsObject()
  amenities?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityPeriodDto)
  availability?: AvailabilityPeriodDto[];
}
