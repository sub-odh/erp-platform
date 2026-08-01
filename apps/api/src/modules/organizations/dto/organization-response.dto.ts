import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  legalName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  registrationNumber!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  taxNumber!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  phone!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  website!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  addressLine1!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  addressLine2!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  city!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  state!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  postalCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  country!: string | null;

  @ApiProperty()
  currencyCode!: string;

  @ApiProperty()
  timezone!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: Date;
}
