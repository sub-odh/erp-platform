import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimUppercaseString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    example: 'My Company',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimString)
  name?: string;

  @ApiPropertyOptional({
    example: 'My Company Private Limited',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @Transform(trimString)
  legalName?: string;

  @ApiPropertyOptional({
    example: 'REG-123456',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  registrationNumber?: string;

  @ApiPropertyOptional({
    example: 'VAT-987654',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  taxNumber?: string;

  @ApiPropertyOptional({
    example: 'info@mycompany.com',
    maxLength: 320,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Transform(trimString)
  email?: string;

  @ApiPropertyOptional({
    example: '+1 555 0100',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimString)
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://mycompany.com',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  @Transform(trimString)
  website?: string;

  @ApiPropertyOptional({
    example: '100 Business Street',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @Transform(trimString)
  addressLine1?: string;

  @ApiPropertyOptional({
    example: 'Suite 5',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @Transform(trimString)
  addressLine2?: string;

  @ApiPropertyOptional({
    example: 'Kathmandu',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  city?: string;

  @ApiPropertyOptional({
    example: 'Bagmati',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  state?: string;

  @ApiPropertyOptional({
    example: '44600',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'Nepal',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  country?: string;

  @ApiPropertyOptional({
    example: 'NPR',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(trimUppercaseString)
  currencyCode?: string;

  @ApiPropertyOptional({
    example: 'Asia/Kathmandu',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  timezone?: string;
}
