"use client";

import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui";
import { apiRequestBlob } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getMyEmployee } from "@/lib/employees";
import { toMediaApiPath } from "@/lib/media";
import { approveMemo, confirmMemo, getMemo, rejectMemo, verifyMemo } from "@/lib/memos";
import { PHP_ROLE_1 } from "@/lib/role-access";
import type { UserRole } from "@/types/auth";
import type { Memo, MemoAttachment, MemoStatus } from "@/types/memo";

const STATUS_LABEL: Record<MemoStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  CONFIRMED: "Confirmed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const PREVIEW_EXTENSIONS = new Set(["jpg", "jpeg", "png", "tif", "pdf", "txt"]);

export default function MemoDetailPage() {
  const params = useParams<{ id: string }>();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{
    url: string;
    ext: string;
    name: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMissing(false);

    try {
      const [record, me] = await Promise.all([
        getMemo(params.id),
        getMyEmployee().catch(() => null),
      ]);
      setMemo(record);
      setEmployeeId(me?.id ?? null);
    } catch {
      setMemo(null);
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null);
    void load();
  }, [load]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);

    if (search.get("error_type") === "conflict") {
      setAlertMessage(search.get("msg") ?? "");
    }
  }, []);

  useEffect(() => {
    if (!memo) {
      return;
    }

    if (new URLSearchParams(window.location.search).get("print") !== "true") {
      return;
    }

    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [memo]);

  useEffect(() => {
    return () => {
      if (viewer?.url) {
        URL.revokeObjectURL(viewer.url);
      }
    };
  }, [viewer]);

  async function runAction(action: () => Promise<Memo>) {
    setBusy(true);

    try {
      setMemo(await action());
    } catch (requestError) {
      setAlertMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this memo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openAttachment(attachment: MemoAttachment) {
    const ext = fileExtension(attachment.fileName, attachment.mimeType);
    const path = toMediaApiPath(attachment.fileUrl);

    if (!path) {
      return;
    }

    const blob = await apiRequestBlob(path);
    const url = URL.createObjectURL(blob);

    if (!PREVIEW_EXTENSIONS.has(ext)) {
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    setViewer({ url, ext, name: attachment.fileName });
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!memo || missing) {
    return <p className="text-sm text-slate-800">Memo not found.</p>;
  }

  const step =
    memo.status === "APPROVED"
      ? Math.max(memo.currentStep, 5)
      : memo.status === "REJECTED"
        ? 1
        : memo.currentStep;
  const canAction = canActOnMemo(memo, role, employeeId);

  return (
    <div>
      <style>{PRINT_CSS}</style>

      {alertMessage !== null ? (
        <div className="memo-no-print fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-w-sm rounded-[20px] border border-white/30 bg-white/20 px-8 py-8 text-center text-white">
            <Shield className="mx-auto mb-3" size={48} />
            <h2 className="text-xl font-semibold">Security Alert</h2>
            <p className="mt-2 text-sm">{alertMessage}</p>
            <button
              type="button"
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900"
              onClick={() => setAlertMessage(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {viewer ? (
        <div className="memo-no-print fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mb-3 flex gap-2">
            <a
              href={viewer.url}
              download={viewer.name}
              className="rounded-full bg-[#0d6efd] px-4 py-2 text-sm font-bold text-white"
            >
              Download File
            </a>
            <button
              type="button"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
              onClick={() => setViewer(null)}
            >
              Close Preview
            </button>
          </div>
          <div className="flex w-full justify-center">
            {["jpg", "jpeg", "png", "tif"].includes(viewer.ext) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewer.url}
                alt={viewer.name}
                className="max-h-[80vh] max-w-[90%] rounded-[10px] shadow-2xl"
              />
            ) : (
              <iframe
                title={viewer.name}
                src={viewer.url}
                className="h-[80vh] w-[90%] rounded-[10px] border-0 bg-white"
              />
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="memo-column lg:col-span-9">
          {canAction ? (
            <div className="memo-no-print mb-4 flex items-center justify-between rounded-lg bg-[#0d6efd] px-4 py-3 text-white shadow-sm">
              <div>
                <h2 className="text-sm font-bold">Pending Your Review</h2>
                <p className="text-xs">Verify details and take action.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 disabled:opacity-60"
                  onClick={() =>
                    void runAction(() => advanceMemo(memo.id, step))
                  }
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full bg-[#dc3545] px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
                  onClick={() => void runAction(() => rejectMemo(memo.id))}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg bg-white shadow-sm">
            <div className="p-6 sm:p-10">
              <div className="mb-8 text-center">
                <h2 className="mb-0 text-3xl font-bold text-slate-900">
                  INTERNAL MEMORANDUM
                </h2>
                <p className="text-xs text-slate-500">#MEMO-{memo.id}</p>
              </div>

              <div className="mb-4 grid grid-cols-2 text-sm">
                <div>
                  <p className="mb-1">
                    <b>Date:</b> {formatMemoDate(memo.createdAt)}
                  </p>
                  <p>
                    <b>From:</b> {memo.raisedByName} ({memo.raisedByDesignation ?? ""})
                  </p>
                </div>
                <p className="mb-1 text-right">
                  <b>Status:</b>{" "}
                  <span className="inline-flex rounded bg-[#212529] px-2 py-0.5 text-xs font-semibold text-white">
                    {STATUS_LABEL[memo.status]}
                  </span>
                </p>
              </div>

              <h3 className="mb-3 text-xl font-bold text-slate-900">{memo.title}</h3>
              <hr className="border-slate-200" />
              {isMemoHtml(memo.content) ? (
                <div
                  className="memo-content mb-8 mt-4 min-h-[350px] text-sm leading-6 text-slate-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: sanitizeMemoHtml(memo.content) }}
                />
              ) : (
                <div className="memo-content mb-8 mt-4 min-h-[350px] whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {memo.content}
                </div>
              )}

              <div className="mt-10 flex justify-between gap-2 pt-10">
                <Signature
                  name={memo.raisedByName}
                  role="Memo Raiser"
                  accent
                />
                <Signature
                  name={step > 2 ? memo.verifierName || ".........." : ".........."}
                  role="Verifier"
                />
                <Signature
                  name={memo.hodSignedBy ? memo.hodSignedByName || ".........." : ".........."}
                  role="Confirmed By"
                />
                <Signature
                  name={memo.ceoSignedBy ? memo.ceoSignedByName || ".........." : ".........."}
                  role="Approved By"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="memo-no-print lg:col-span-3">
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Workflow Details</h2>
            <div className="relative pl-5">
              <div className="absolute bottom-0 left-[7px] top-0 w-0.5 bg-[#e9ecef]" />
              <WorkflowNode
                state="completed"
                title="Memo Raiser"
                name={memo.raisedByName}
                description={memo.raisedByDesignation ?? ""}
                time={formatMemoStamp(memo.createdAt)}
              />
              <WorkflowNode
                state={step > 2 ? "completed" : step === 2 ? "active" : "waiting"}
                title="Verifier"
                name={memo.verifierName ?? ""}
                description={memo.verifierDesignation ?? ""}
                time={step > 2 ? "Verified" : "Awaiting Verification"}
              />
              <WorkflowNode
                state={step > 3 ? "completed" : step === 3 ? "active" : "waiting"}
                title="Confirmed By"
                name={memo.hodSignedByName ?? "Department Head"}
                description={memo.hodDesignation ?? "HOD"}
              />
              <WorkflowNode
                state={step > 4 ? "completed" : step === 4 ? "active" : "waiting"}
                title="Approved By"
                name={memo.ceoSignedByName ?? "CEO"}
                description={memo.ceoDesignation ?? "Executive Authority"}
              />
            </div>
          </div>

          {memo.attachments.length > 0 ? (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-900">
                Supporting Documents
              </h2>
              {memo.attachments.map((attachment) => {
                const ext = fileExtension(attachment.fileName, attachment.mimeType);
                const icon = iconForExtension(ext);

                return (
                  <button
                    key={attachment.id}
                    type="button"
                    className="mb-2 flex w-full items-center rounded-[10px] border border-[#edf2f7] p-2.5 text-left hover:border-[#0d6efd] hover:bg-[#f8fafc]"
                    onClick={() => void openAttachment(attachment)}
                  >
                    <span className={`mr-2.5 flex h-[30px] w-[30px] items-center justify-center ${icon.color}`}>
                      <icon.Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold" title={attachment.fileName}>
                        {attachment.fileName}
                      </span>
                      <span className="text-[0.65rem] text-slate-500">
                        {ext.toUpperCase()} File
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Signature({
  name,
  role,
  accent = false,
}: {
  name: string;
  role: string;
  accent?: boolean;
}) {
  return (
    <div className="w-[22%] border-t border-black pt-2 text-center text-[11px] leading-snug">
      <b>{name}</b>
      <span
        className={`mt-0.5 block text-[9px] font-extrabold uppercase ${accent ? "text-[#0d6efd]" : "text-[#555]"}`}
      >
        {role}
      </span>
    </div>
  );
}

function WorkflowNode({
  state,
  title,
  name,
  description,
  time,
}: {
  state: "completed" | "active" | "waiting";
  title: string;
  name: string;
  description: string;
  time?: string;
}) {
  const dot =
    state === "completed"
      ? "bg-[#198754] shadow-[0_0_0_3px_rgba(25,135,84,0.2)]"
      : state === "active"
        ? "bg-[#0d6efd] shadow-[0_0_0_3px_rgba(13,110,253,0.2)]"
        : "bg-[#dee2e6]";

  return (
    <div className="relative z-[1] mb-5">
      <span
        className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-white ${dot}`}
      />
      <div className="pl-2.5">
        <div className="mb-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-[#0d6efd]">
          {title}
        </div>
        <p className="mb-0 text-[0.85rem] font-semibold text-[#333]">{name}</p>
        <p className="text-xs leading-tight text-[#888]">{description}</p>
        {time ? <p className="mt-1 text-[0.7rem] italic text-[#6c757d]">{time}</p> : null}
      </div>
    </div>
  );
}

function canActOnMemo(
  memo: Memo,
  role: UserRole | null,
  employeeId: string | null,
): boolean {
  if (memo.status === "APPROVED" || memo.status === "REJECTED" || !role) {
    return false;
  }

  const role1 = (PHP_ROLE_1 as readonly string[]).includes(role);
  const step = memo.currentStep;

  if (step === 2 && (employeeId === memo.verifierId || role1)) {
    return true;
  }

  if (
    step === 3 &&
    (role === "MANAGEMENT" || role1) &&
    (employeeId !== memo.verifierId || role1)
  ) {
    return true;
  }

  return step === 4 && (role === "HEAD" || role1);
}

function advanceMemo(memoId: string, step: number) {
  if (step === 2) {
    return verifyMemo(memoId);
  }

  if (step === 3) {
    return confirmMemo(memoId);
  }

  return approveMemo(memoId);
}

function fileExtension(fileName: string, mimeType: string | null): string {
  const fromName = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() ?? ""
    : "";

  if (fromName) {
    return fromName;
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  return "file";
}

function iconForExtension(ext: string): { Icon: LucideIcon; color: string } {
  if (ext === "pdf") {
    return { Icon: FileText, color: "text-[#dc3545]" };
  }

  if (ext === "docx") {
    return { Icon: FileText, color: "text-[#0d6efd]" };
  }

  if (ext === "xlsx" || ext === "csv") {
    return { Icon: FileSpreadsheet, color: ext === "csv" ? "text-[#0dcaf0]" : "text-[#198754]" };
  }

  if (ext === "pptx") {
    return { Icon: FileSpreadsheet, color: "text-[#ffc107]" };
  }

  if (["jpg", "jpeg", "png", "tif"].includes(ext)) {
    return { Icon: FileImage, color: "text-slate-500" };
  }

  return { Icon: File, color: "text-slate-500" };
}

function formatMemoDate(value: string): string {
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function formatMemoStamp(value: string): string {
  const date = new Date(value);
  let hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatMemoDate(value)} | ${String(hours).padStart(2, "0")}:${minutes} ${suffix}`;
}

function isMemoHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeMemoHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

const PRINT_CSS = `
@media print {
  aside, header, footer { display: none !important; }
  .memo-no-print { display: none !important; }
  main { padding: 0 !important; background: #fff !important; }
  .min-h-screen > div { padding-left: 0 !important; }
  .memo-column { width: 100% !important; max-width: 100% !important; }
}
`;
