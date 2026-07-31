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
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    example: 'Bearer',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    example: 900,
  })
  expiresIn!: number;

  @ApiProperty({
    example: 2592000,
  })
  refreshExpiresIn!: number;

  @ApiProperty({
    type: LoginUserDto,
  })
  user!: LoginUserDto;
}
