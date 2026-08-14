import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const SMTP_ENCRYPTION_TYPES = ['SSL', 'STARTTLS', 'NONE'] as const;
export type SmtpEncryption = (typeof SMTP_ENCRYPTION_TYPES)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateSmtpConfigurationDto {
  @ApiProperty({ example: 'smtp.gmail.com' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  host!: string;

  @ApiProperty({ example: 465 })
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @ApiProperty({ example: 'notifications@example.com' })
  @IsString()
  @MinLength(1)
  @MaxLength(320)
  @Transform(trim)
  username!: string;

  @ApiPropertyOptional({
    description: 'Required when configuring SMTP initially',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  password?: string;

  @ApiProperty({ enum: SMTP_ENCRYPTION_TYPES, example: 'SSL' })
  @IsIn(SMTP_ENCRYPTION_TYPES)
  encryption!: SmtpEncryption;

  @ApiProperty({ example: 'notifications@example.com' })
  @IsEmail()
  @MaxLength(320)
  @Transform(trim)
  fromEmail!: string;

  @ApiProperty({ example: 'Variable ERP System' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  senderName!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
