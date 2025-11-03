import { IsOptional, IsEnum } from 'class-validator';
import { CurrencyType } from '../../common/enums/currency-type.enum';

export class GetBalancesDto {
  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;
}
