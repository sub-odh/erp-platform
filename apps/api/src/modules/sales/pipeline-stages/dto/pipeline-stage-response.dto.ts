import type { SalesPipelineStage } from '@erp/db';

export class PipelineStageResponseDto {
  id!: string;
  name!: string;
  position!: number;
  probability!: number;
  isClosed!: boolean;
  isWon!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(stage: SalesPipelineStage): PipelineStageResponseDto {
    return {
      id: stage.id,
      name: stage.name,
      position: stage.position,
      probability: stage.probability,
      isClosed: stage.isClosed,
      isWon: stage.isWon,
      isActive: stage.isActive,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
    };
  }
}
