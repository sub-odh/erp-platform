"use client";

import { MapPinned, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Spinner } from "@/components/ui";
import { getSupportVisits } from "@/lib/visits";
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

export default function SupportVisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<SupportVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setVisits(await getSupportVisits());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load support visits.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <MapPinned size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              All Support Visits
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Company-wide technician visits and issue history.
            </p>
          </div>
        </div>

        <Button onClick={() => router.push("/hr/support-visits/new")}>
          <Plus size={17} />
          Support Visit Form
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && visits.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <SupportVisitTable
          visits={visits}
          empty="No support visits recorded."
          onView={(id) => router.push(`/hr/support-visits/${id}`)}
        />
      )}
    </div>
  );
}

function SupportVisitTable({
  visits,
  empty,
  onView,
}: {
  visits: SupportVisit[];
  empty: string;
  onView: (id: string) => void;
}) {
  if (visits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visit No.
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Technician
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visits.map((visit) => (
            <tr key={visit.id}>
              <td className="px-5 py-3 font-semibold text-slate-900">
                {visit.visitNumber}
              </td>
              <td className="px-4 py-3 text-slate-700">{visit.clientName}</td>
              <td className="px-4 py-3 text-slate-600">{visit.visitDate}</td>
              <td className="px-4 py-3 text-slate-600">{visit.visitType}</td>
              <td className="px-4 py-3 text-slate-600">
                {visit.technicianName ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[visit.status]}>{visit.status}</Badge>
              </td>
              <td className="px-5 py-3 text-right">
                <Button size="sm" variant="outline" onClick={() => onView(visit.id)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
