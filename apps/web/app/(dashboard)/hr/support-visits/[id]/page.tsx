"use client";

import { ArrowLeft, MapPinned } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, Card, CardContent, Spinner } from "@/components/ui";
import { getSupportVisit } from "@/lib/visits";
import type { SupportVisit, SupportVisitStatus } from "@/types/visit";

const STATUS_VARIANT: Record<
  SupportVisitStatus,
  "warning" | "primary" | "success" | "danger"
> = {
  PENDING: "warning",
  ONGOING: "primary",
  RESOLVED: "success",
  ESCALATED: "danger",
};

export default function SupportVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<SupportVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setVisit(await getSupportVisit(params.id));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this support visit.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error ?? "Support visit was not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Support Visits
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <MapPinned size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">{visit.visitNumber}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {visit.clientName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {visit.visitDate}
              {visit.technicianName ? ` · ${visit.technicianName}` : ""}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[visit.status]}>{visit.status}</Badge>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="Visit Type" value={visit.visitType} />
          <Info label="Department" value={visit.deptName ?? "—"} />
          <Info label="Category" value={visit.category ?? "—"} />
          <Info label="Priority" value={visit.priority ?? "—"} />
          <Info label="Client Call Time" value={formatTime(visit.clientCallTime)} />
          <Info label="Time Started" value={formatTime(visit.timeStarted)} />
          <Info label="Time Ended" value={formatTime(visit.timeEnded)} />
          <Info label="Total Hours" value={visit.totalHours ?? "—"} />
          <Info label="Team Members" value={visit.teamMembers ?? "—"} />
          <div className="sm:col-span-2">
            <Info label="Issue Description" value={visit.issueDescription ?? "—"} />
          </div>
          <div className="sm:col-span-2">
            <Info label="Action Taken" value={visit.actionTaken ?? "—"} />
          </div>
          <div className="sm:col-span-2">
            <Info label="Parts Used" value={visit.partsUsed ?? "—"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "—";
}
