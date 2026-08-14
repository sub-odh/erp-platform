import { ApiProperty } from '@nestjs/swagger';

const USER_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] as const;

export class LoginUserDto {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  organizationId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({
    enum: USER_ROLES,
  })
  role!: (typeof USER_ROLES)[number];

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/uploads/users/550e8400-e29b-41d4-a716-446655440000.webp',
  })
  avatarUrl!: string | null;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({
    example: 'Bearer',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    example: 900,
  })
  expiresIn!: number;

  @ApiProperty({
    type: LoginUserDto,
  })
  user!: LoginUserDto;

  @ApiProperty({
    example: {
      status: 'valid',
      licensedModules: ['admin', 'sales'],
      validUntil: '2027-12-31',
      maxUsers: 50,
      daysUntilExpiry: 365,
    },
  })
  license!: {
    status: 'valid' | 'warning' | 'read_only' | 'blocked';
    licensedModules: string[];
    validUntil: string;
    maxUsers: number;
    daysUntilExpiry: number;
  };
}
