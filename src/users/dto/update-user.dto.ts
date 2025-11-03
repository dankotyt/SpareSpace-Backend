import { IsString, IsOptional, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  patronymic?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone format' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFaEnabled?: boolean;
}
