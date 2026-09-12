import { apiRequest } from "@/lib/api";
import type { ReviewTadaInput, TadaExpense, TadaInput } from "@/types/expense";

const PATH = "/hr/tada";

export function getTadaExpenses() {
  return apiRequest<TadaExpense[]>(PATH);
}

export function getMyTadaExpenses() {
  return apiRequest<TadaExpense[]>(`${PATH}/mine`);
}

export function createTadaExpense(payload: TadaInput) {
  return apiRequest<TadaExpense>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveTadaExpense(expenseId: string, payload: ReviewTadaInput = {}) {
  return apiRequest<TadaExpense>(`${PATH}/${expenseId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rejectTadaExpense(expenseId: string, payload: ReviewTadaInput = {}) {
  return apiRequest<TadaExpense>(`${PATH}/${expenseId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
