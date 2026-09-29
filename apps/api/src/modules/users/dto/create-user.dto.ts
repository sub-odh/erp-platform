import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PASSWORD_MAX_LENGTH } from '../../../common/security/password-policy';

export const ASSIGNABLE_USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR',
  'OPERATIONS',
  'EMPLOYEE',
  'SALES',
  'MANAGEMENT',
  'HEAD',
] as const;

export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number];

export class CreateUserDto {
  @ApiProperty({ example: 'EMP-001', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeId!: string;

  @ApiProperty({
    example: 'employee@mycompany.com',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    example: '12345678',
    minLength: 1,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiProperty({
    example: 'Jane',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    enum: ASSIGNABLE_USER_ROLES,
    example: 'EMPLOYEE',
  })
  @IsIn(ASSIGNABLE_USER_ROLES)
  role!: AssignableUserRole;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  employeeRole?: string;

  @ApiProperty({ format: 'date', example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  joinedDate?: string;
}
