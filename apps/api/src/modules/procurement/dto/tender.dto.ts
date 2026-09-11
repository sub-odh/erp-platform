import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListTendersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class CreateTenderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsDateString()
  submissionDate!: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  details?: string | null;
}

export class UpdateTenderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsDateString()
  submissionDate?: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  details?: string | null;
}
