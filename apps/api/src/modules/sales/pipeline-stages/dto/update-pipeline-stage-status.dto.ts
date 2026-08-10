import { IsBoolean } from 'class-validator';

export class UpdatePipelineStageStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
