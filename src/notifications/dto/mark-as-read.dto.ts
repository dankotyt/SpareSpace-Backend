import { IsOptional, IsArray, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkAsReadDto {
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsPositive({ each: true })
  ids?: number[]; // для bulk-обновления
}
