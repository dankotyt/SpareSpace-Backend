import { IsNumber, Min, IsEnum, IsInt, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class TransferDto {
  @Type(() => Number)
  @IsInt()
  toUserId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsOptional()
  @IsString()
  description?: string;
}
