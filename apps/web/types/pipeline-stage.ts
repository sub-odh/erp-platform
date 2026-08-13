export interface PipelineStage {
  id: string;

  name: string;

  position: number;

  probability: number;

  isClosed: boolean;

  isWon: boolean;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}
