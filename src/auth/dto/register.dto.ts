// src/auth/dto/register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role)
  role: Role;
}
