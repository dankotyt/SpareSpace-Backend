import { IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyType } from '../../common/enums/currency-type.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class TopupDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  gatewayTransactionId?: string; // ID транзакции от шлюза оплаты
}
