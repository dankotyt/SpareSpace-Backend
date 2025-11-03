import { IsNumber, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class WithdrawDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsString()
  destination: string; // Адрес кошелька или банковские реквизиты
}
