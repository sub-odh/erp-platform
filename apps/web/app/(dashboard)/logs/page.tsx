"use client";

import { Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AuthenticatedImage } from "@/components/media";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getLogLedger, type LogLedger, type LogTab } from "@/lib/logs";

const TABS: { id: LogTab; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "audit", label: "Audit" },
  { id: "inventory", label: "Inventory" },
  { id: "system", label: "System" },
  { id: "mail", label: "Mail" },
];

export default function LogsPage() {
  const [tab, setTab] = useState<LogTab>("activity");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ledger, setLedger] = useState<LogLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState<{
    name: string;
    designation: string;
    photoUrl: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLedger(await getLogLedger({ tab, search, page }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(draft.trim());
  }

  const rows = ledger?.rows ?? [];
  const total = ledger?.total ?? 0;
  const totalPages = ledger?.totalPages ?? 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Audit & Logs</h1>
          <p className="text-sm text-slate-500">
            Total Records: {total.toLocaleString("en-US")}
          </p>
        </div>
        <form onSubmit={applySearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search logs..."
              className="h-9 w-56 rounded-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <Button type="submit">Filter</Button>
          {search ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>
      </div>

      <div className="inline-flex flex-wrap gap-2 rounded-full border bg-white p-2 shadow-sm">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              tab === item.id ? "bg-blue-600 text-white" : "text-slate-500",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">
                    {tab === "mail" ? "Recipient" : "User"}
                  </th>
                  <th className="px-4 py-3 text-left">Action / Status</th>
                  {tab === "inventory" ? (
                    <th className="px-4 py-3 text-left">Qty Change</th>
                  ) : null}
                  <th className="px-4 py-3 text-left">Details / Subject</th>
                  {tab === "activity" || tab === "audit" || tab === "system" ? (
                    <th className="px-4 py-3 text-left">IP Address</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center italic text-slate-400">
                      No logs recorded for this category.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 text-slate-400">
                        {(page - 1) * 20 + index + 1}.
                      </td>
                      <td className="px-4 py-2.5">{row.timestamp}</td>
                      <td className="px-4 py-2.5">
                        {tab === "mail" ? (
                          <span className="font-medium text-slate-900">
                            {row.recipient ?? "N/A"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            {row.userName ? (
                              <button
                                type="button"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-blue-600"
                                onClick={() =>
                                  setPerson({
                                    name: row.userName ?? "System",
                                    designation: row.designation ?? "User",
                                    photoUrl: row.photoUrl,
                                  })
                                }
                              >
                                <UserRound size={12} />
                              </button>
                            ) : null}
                            {row.userName ?? "System"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={row.action} />
                      </td>
                      {tab === "inventory" ? (
                        <td
                          className={cn(
                            "px-4 py-2.5 font-bold",
                            (row.qtyChange ?? 0) >= 0 ? "text-emerald-600" : "text-red-600",
                          )}
                        >
                          {(row.qtyChange ?? 0) > 0
                            ? `+${row.qtyChange}`
                            : row.qtyChange}
                        </td>
                      ) : null}
                      <td className="px-4 py-2.5">
                        {tab === "mail" ? (
                          <div>
                            <strong>{row.subject ?? "No Subject"}</strong>
                            {row.details ? (
                              <small className="mt-1 block text-red-600">
                                {row.details}
                              </small>
                            ) : null}
                          </div>
                        ) : (
                          row.details ?? "N/A"
                        )}
                      </td>
                      {tab === "activity" || tab === "audit" || tab === "system" ? (
                        <td className="px-4 py-2.5">
                          <code>{row.ipAddress ?? "127.0.0.1"}</code>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {person ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="relative w-full max-w-xs rounded-2xl bg-white/90 px-6 py-8 text-center shadow-sm backdrop-blur">
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-500"
              onClick={() => setPerson(null)}
            >
              ×
            </button>
            {person.photoUrl ? (
              <AuthenticatedImage
                src={person.photoUrl}
                alt=""
                className="mx-auto mb-2 h-16 w-16 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                {person.name.slice(0, 1)}
              </div>
            )}
            <h2 className="font-bold text-slate-900">{person.name}</h2>
            <p className="text-sm text-slate-500">{person.designation}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const key = action.toUpperCase();
  const tone =
    key === "CREATE" || key === "ADDITION" || key === "SENT" || key === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : key === "UPDATE" || key === "ADJUSTMENT" || key === "PENDING"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : key === "DELETE" || key === "REMOVAL" || key === "FAILED" || key === "ERROR"
          ? "bg-red-50 text-red-700 border-red-200"
          : key === "VOID" || key === "RETURN"
            ? "bg-slate-800 text-white border-slate-800"
            : key === "LOGIN" || key === "REPLACEMENT" || key === "SALE"
              ? "bg-sky-50 text-sky-700 border-sky-200"
              : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold", tone)}>
      {key}
    </span>
  );
}
