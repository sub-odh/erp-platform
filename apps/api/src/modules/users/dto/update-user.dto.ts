import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  ASSIGNABLE_USER_ROLES,
  type AssignableUserRole,
} from './create-user.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'EMP-001', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeId?: string;

  @ApiPropertyOptional({
    example: 'Jane',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    enum: ASSIGNABLE_USER_ROLES,
    example: 'MANAGER',
  })
  @IsOptional()
  @IsIn(ASSIGNABLE_USER_ROLES)
  role?: AssignableUserRole;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  employeeRole?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  joinedDate?: string;
}
