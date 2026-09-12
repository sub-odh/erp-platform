"use client";

import { ArrowLeft, Printer, StickyNote } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Card, CardContent, Spinner } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { getMyEmployee } from "@/lib/employees";
import { canManageMemos } from "@/lib/hr-access";
import { openAuthenticatedMedia } from "@/lib/media";
import {
  approveMemo,
  confirmMemo,
  getMemo,
  rejectMemo,
  uploadMemoAttachment,
  verifyMemo,
} from "@/lib/memos";
import type { Memo, MemoStatus } from "@/types/memo";

const STATUS_VARIANT: Record<MemoStatus, "warning" | "primary" | "purple" | "success" | "danger"> = {
  PENDING: "warning",
  VERIFIED: "primary",
  CONFIRMED: "purple",
  APPROVED: "success",
  REJECTED: "danger",
};

export default function MemoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [record, me] = await Promise.all([
        getMemo(params.id),
        getMyEmployee().catch(() => null),
      ]);
      setMemo(record);
      setEmployeeId(me?.id ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this memo.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: () => Promise<Memo>) {
    setBusy(true);
    setError(null);

    try {
      setMemo(await action());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this memo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAttachment(file: File | undefined) {
    if (!file || !memo) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setMemo(await uploadMemoAttachment(memo.id, file));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload the attachment.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error ?? "Memo was not found."}
      </div>
    );
  }

  const user = getStoredUser();
  const manage = canManageMemos(user?.role);
  const isVerifier = employeeId !== null && employeeId === memo.verifierId;
  const canAttach =
    manage || (employeeId !== null && employeeId === memo.raisedBy);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/hr/memos")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 print:hidden"
      >
        <ArrowLeft size={16} />
        Memo Lists
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 print:hidden">
            <StickyNote size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 print:hidden">
              Official Memo
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {memo.title}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Raised by {memo.raisedByName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Badge variant={STATUS_VARIANT[memo.status]}>{memo.status}</Badge>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 print:hidden">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Content
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {memo.content}
            </p>
          </section>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Verifier" value={memo.verifierName ?? "—"} />
            <Info label="Current Step" value={String(memo.currentStep)} />
            <Info
              label="Verifier Signed By"
              value={memo.verifierSignedByName ?? "Pending"}
            />
            <Info label="HOD Signed By" value={memo.hodSignedByName ?? "Pending"} />
            <Info label="CEO Signed By" value={memo.ceoSignedByName ?? "Pending"} />
          </dl>

          {memo.attachments.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Attachments
              </h2>
              <ul className="mt-2 space-y-2">
                {memo.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600 hover:underline"
                      onClick={() => void openAuthenticatedMedia(attachment.fileUrl)}
                    >
                      {attachment.fileName}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 print:hidden">
        {memo.status === "PENDING" && (isVerifier || manage) ? (
          <Button
            loading={busy}
            onClick={() => void runAction(() => verifyMemo(memo.id))}
          >
            Verify Memo
          </Button>
        ) : null}
        {memo.status === "VERIFIED" && manage ? (
          <Button
            loading={busy}
            onClick={() => void runAction(() => confirmMemo(memo.id))}
          >
            Confirm Memo
          </Button>
        ) : null}
        {memo.status === "CONFIRMED" && manage ? (
          <Button
            loading={busy}
            onClick={() => void runAction(() => approveMemo(memo.id))}
          >
            Approve Memo
          </Button>
        ) : null}
        {memo.status !== "APPROVED" && memo.status !== "REJECTED" && manage ? (
          <Button
            variant="danger"
            loading={busy}
            onClick={() => void runAction(() => rejectMemo(memo.id))}
          >
            Reject Memo
          </Button>
        ) : null}
        {canAttach && memo.status !== "REJECTED" ? (
          <label className="inline-flex">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(event) => {
                void handleAttachment(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <span className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Add Attachment
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
