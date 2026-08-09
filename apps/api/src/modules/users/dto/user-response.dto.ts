import { ApiProperty } from '@nestjs/swagger';

import type { User } from '@erp/db';

export class UserResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  organizationId!: string;

  @ApiProperty({
    example: 'employee@mycompany.com',
  })
  email!: string;

  @ApiProperty({
    example: 'Jane',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    enum: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
  })
  role!: User['role'];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/uploads/users/550e8400-e29b-41d4-a716-446655440000.webp',
  })
  avatarUrl!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000.webp',
  })
  avatarFileName!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'image/webp',
  })
  avatarMimeType!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 48291,
  })
  avatarSize!: number | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  deletedAt!: Date | null;
}

export class UserListCountsDto {
  @ApiProperty()
  active!: number;

  @ApiProperty()
  inactive!: number;

  @ApiProperty()
  archived!: number;

  @ApiProperty()
  total!: number;
}

export class UserListPaginationDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  hasNextPage!: boolean;

  @ApiProperty()
  hasPreviousPage!: boolean;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    isArray: true,
  })
  data!: UserResponseDto[];

  @ApiProperty({
    type: UserListPaginationDto,
  })
  pagination!: UserListPaginationDto;

  @ApiProperty({
    type: UserListCountsDto,
  })
  counts!: UserListCountsDto;
}
