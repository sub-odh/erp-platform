import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
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
}
