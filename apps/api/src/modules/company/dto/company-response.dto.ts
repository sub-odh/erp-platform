import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
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

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  registrationDate!: string | null;

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

  @ApiPropertyOptional({ nullable: true, example: '10:00' })
  officeStartTime!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '17:30' })
  officeEndTime!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  logoFileName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  logoMimeType!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  logoSize!: number | null;

  @ApiPropertyOptional({ nullable: true })
  invoiceLogoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  invoiceLogoFileName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  invoiceLogoMimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  invoiceLogoSize!: number | null;

  @ApiPropertyOptional({ nullable: true })
  faviconUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconFileName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconMimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconSize!: number | null;

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: Date;
}
