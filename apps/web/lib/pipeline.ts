import { apiRequest } from "@/lib/api";

export type PipelineStage =
  | "Discovery"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Closing"
  | "Won"
  | "Lost";

export interface PipelineLead {
  id: string;
  createdAt: string;
  companyName: string | null;
  projectTitle: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  stage: PipelineStage;
  stagePercent: number;
  dealValue: string;
  weightedValue: string;
  assignedName: string;
  quotationId: string | null;
}

export interface PipelineMetrics {
  totalPipelineValue: string;
  weightedPipelineValue: string;
  totalOpportunities: number;
  winRate: number;
  wonDeals: number;
  stageCount: number;
}

export interface DealQuotation {
  id: string;
  quotationNumber: string;
  totalAmount: string;
  currency: "NPR" | "USD";
  isFinal: number;
  createdAt: string;
}

export interface DealDeliveryOrder {
  id: string;
  deliveryNumber: string;
  deliveryDate: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  createdAt: string;
}

export interface DealEmployee {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DealDetails {
  id: string;
  companyName: string;
  projectTitle: string;
  contactPerson: string;
  phone: string;
  email: string;
  source: string;
  stage: PipelineStage;
  stagePercent: number;
  dealValue: string;
  winningProbability: number;
  expectedClosing: string | null;
  dealRemarks: string;
  createdAt: string;
  assignedEmployeeId: string | null;
  assignedName: string;
  canUpdate: boolean;
  quotations: DealQuotation[];
  deliveryOrders: DealDeliveryOrder[];
  employees: DealEmployee[];
}

const PATH = "/sales/leads";

export function getPipeline(params: {
  view?: "all" | "my";
  sort?: string;
  direction?: "asc" | "desc";
}): Promise<{ items: PipelineLead[]; metrics: PipelineMetrics }> {
  const search = new URLSearchParams();
  if (params.view) search.set("view", params.view);
  if (params.sort) search.set("sort", params.sort);
  if (params.direction) search.set("direction", params.direction);
  const query = search.toString();
  return apiRequest(`${PATH}/pipeline${query ? `?${query}` : ""}`);
}

export function createPipelineLead(body: Record<string, unknown>): Promise<{ id: string }> {
  return apiRequest(`${PATH}/pipeline`, { method: "POST", body: JSON.stringify(body) });
}

export function getDeal(id: string): Promise<DealDetails> {
  return apiRequest(`${PATH}/${id}/deal`);
}

export function updatePipelineStage(id: string, stage: PipelineStage): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) });
}

export function updatePipelineProfile(id: string, body: Record<string, unknown>): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/profile`, { method: "PUT", body: JSON.stringify(body) });
}

export function updatePipelineSource(id: string, source: string): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/source`, { method: "PATCH", body: JSON.stringify({ source }) });
}

export function postPipelineActivity(id: string, remarks: string): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/activity`, { method: "POST", body: JSON.stringify({ remarks }) });
}

export function updatePipelineSettings(id: string, body: Record<string, unknown>): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/settings`, { method: "PUT", body: JSON.stringify(body) });
}

export function setFinalQuotation(leadId: string, quotationId: string): Promise<unknown> {
  return apiRequest(`${PATH}/${leadId}/final-quotation`, {
    method: "POST",
    body: JSON.stringify({ quotationId }),
  });
}

export function purgePipelineLead(id: string): Promise<unknown> {
  return apiRequest(`${PATH}/${id}/purge`, { method: "POST" });
}

export const PIPELINE_STAGES: { name: PipelineStage; percent: number; tone: string; bar: string; hex: string }[] = [
  { name: "Discovery", percent: 15, tone: "bg-slate-200 text-slate-700", bar: "bg-slate-500", hex: "#0dcaf0" },
  { name: "Qualification", percent: 30, tone: "bg-cyan-100 text-cyan-800", bar: "bg-cyan-500", hex: "#6f42c1" },
  { name: "Proposal", percent: 45, tone: "bg-blue-100 text-blue-800", bar: "bg-blue-600", hex: "#0d6efd" },
  { name: "Negotiation", percent: 65, tone: "bg-amber-100 text-amber-800", bar: "bg-amber-500", hex: "#fd7e14" },
  { name: "Closing", percent: 80, tone: "bg-slate-300 text-slate-900", bar: "bg-slate-800", hex: "#ffc107" },
  { name: "Won", percent: 100, tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-600", hex: "#198754" },
  { name: "Lost", percent: 0, tone: "bg-rose-100 text-rose-800", bar: "bg-rose-600", hex: "#dc3545" },
];

export function stageMeta(stage: string) {
  return PIPELINE_STAGES.find((item) => item.name === stage) ?? PIPELINE_STAGES[0]!;
}
