import { apiRequest } from "@/lib/api";
import type { Memo, MemoInput } from "@/types/memo";

const PATH = "/hr/memos";

export function getMemos() {
  return apiRequest<Memo[]>(PATH);
}

export function getMemo(memoId: string) {
  return apiRequest<Memo>(`${PATH}/${memoId}`);
}

export function createMemo(payload: MemoInput) {
  return apiRequest<Memo>(PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyMemo(memoId: string) {
  return apiRequest<Memo>(`${PATH}/${memoId}/verify`, { method: "POST" });
}

export function confirmMemo(memoId: string) {
  return apiRequest<Memo>(`${PATH}/${memoId}/confirm`, { method: "POST" });
}

export function approveMemo(memoId: string) {
  return apiRequest<Memo>(`${PATH}/${memoId}/approve`, { method: "POST" });
}

export function rejectMemo(memoId: string) {
  return apiRequest<Memo>(`${PATH}/${memoId}/reject`, { method: "POST" });
}

export function uploadMemoAttachment(memoId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Memo>(`${PATH}/${memoId}/attachments`, {
    method: "POST",
    body: formData,
  });
}
