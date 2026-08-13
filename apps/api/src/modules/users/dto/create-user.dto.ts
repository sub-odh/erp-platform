import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_POLICY_MESSAGE,
} from '../../../common/security/password-policy';

export const ASSIGNABLE_USER_ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const;

export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number];

export class CreateUserDto {
  @ApiProperty({
    example: 'employee@mycompany.com',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    example: 'Erp@2026',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    description:
      'Must contain uppercase, lowercase, number, and special character',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_POLICY_MESSAGE,
  })
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
    example: 'STAFF',
  })
  @IsIn(ASSIGNABLE_USER_ROLES)
  role!: AssignableUserRole;
}
