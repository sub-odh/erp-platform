import { ApiProperty } from '@nestjs/swagger';

const USER_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] as const;

export class UserResponseDto {
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

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: Date;
}
