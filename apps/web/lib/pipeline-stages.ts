import { apiRequest } from "@/lib/api";

import type { PipelineStage } from "@/types/pipeline-stage";

const PIPELINE_STAGES_PATH = "/sales/pipeline-stages";

export function getPipelineStages(): Promise<PipelineStage[]> {
  return apiRequest<PipelineStage[]>(PIPELINE_STAGES_PATH);
}
