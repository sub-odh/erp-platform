"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui";
import { getMemos } from "@/lib/memos";
import type { Memo, MemoStatus } from "@/types/memo";

const STATUS_LABEL: Record<MemoStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  CONFIRMED: "Confirmed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setMemos(await getMemos());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load memos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Internal Memo List</h1>
        <Link
          href="/hr/memos/new"
          className="rounded-full bg-[#0d6efd] px-4 py-2 text-sm text-white hover:bg-[#0b5ed7]"
        >
          New Memo
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {loading && memos.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa]">
              <tr>
                <th className="py-3 pl-6 font-semibold text-slate-900">Subject</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Raised By</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                <th className="py-3 pr-6 text-right font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {memos.map((memo) => (
                <tr key={memo.id} className="border-t border-slate-200 hover:bg-[#f8f9fa]">
                  <td className="py-3 pl-6 font-bold text-slate-900">{memo.title}</td>
                  <td className="px-4 py-3 text-slate-800">{memo.raisedByName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(memo.status)}`}
                    >
                      {STATUS_LABEL[memo.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-6 text-right">
                    <div className="inline-flex">
                      <Link
                        href={`/hr/memos/${memo.id}`}
                        className="border border-slate-300 bg-[#f8f9fa] px-2 py-1 text-xs text-slate-800 hover:bg-slate-200"
                      >
                        View
                      </Link>
                      <Link
                        href={`/hr/memos/${memo.id}?print=true`}
                        className="inline-flex items-center bg-[#212529] px-2 py-1 text-white hover:bg-black"
                        aria-label="Print"
                      >
                        <Printer size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusClass(status: MemoStatus): string {
  if (status === "REJECTED") {
    return "bg-[#dc3545] text-white";
  }

  if (status === "APPROVED") {
    return "bg-[#198754] text-white";
  }

  if (status === "VERIFIED" || status === "CONFIRMED") {
    return "bg-[#0dcaf0] text-[#212529]";
  }

  return "bg-[#0d6efd] text-white";
}
