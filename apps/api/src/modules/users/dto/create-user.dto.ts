import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

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
    example: 'SecurePassword123!',
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
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
