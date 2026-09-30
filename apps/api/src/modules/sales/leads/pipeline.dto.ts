import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PIPELINE_STAGES = [
  'Discovery',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closing',
  'Won',
  'Lost',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_PERCENT: Record<PipelineStage, number> = {
  Discovery: 15,
  Qualification: 30,
  Proposal: 45,
  Negotiation: 65,
  Closing: 80,
  Won: 100,
  Lost: 0,
};

export class PipelineQueryDto {
  @IsOptional()
  @IsIn(['all', 'my'])
  view?: 'all' | 'my';

  @IsOptional()
  @IsIn(['date', 'company', 'project', 'stage', 'deal_val', 'weighted', 'assigned', 'id'])
  sort?: 'date' | 'company' | 'project' | 'stage' | 'deal_val' | 'weighted' | 'assigned' | 'id';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';
}

export class CreatePipelineLeadDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  newCompanyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  clientAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientTaxNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsIn(PIPELINE_STAGES)
  stage?: PipelineStage;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}

export class UpdatePipelineStageDto {
  @IsIn(PIPELINE_STAGES)
  stage!: PipelineStage;
}

export class UpdatePipelineProfileDto {
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}

export class UpdatePipelineSourceDto {
  @IsString()
  @MaxLength(100)
  source!: string;
}

export class PostPipelineActivityDto {
  @IsString()
  @MaxLength(4000)
  remarks!: string;
}

export class UpdatePipelineSettingsDto {
  @IsIn(PIPELINE_STAGES)
  stage!: PipelineStage;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  winningProbability!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dealValue!: number;

  @IsOptional()
  @IsDateString()
  expectedClosing?: string;
}

export class SetFinalQuotationDto {
  @IsUUID()
  quotationId!: string;
}
