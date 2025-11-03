import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
