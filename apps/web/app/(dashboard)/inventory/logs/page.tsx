"use client";

import { RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, Select, Spinner } from "@/components/ui";
import { getInventoryMovements } from "@/lib/inventory";
import type {
  InventoryMovement,
  InventoryMovementsResponse,
} from "@/types/inventory";

const PAGE_SIZE = 20;

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryMovement[]>([]);
  const [pagination, setPagination] = useState<
    InventoryMovementsResponse["pagination"] | null
  >(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInventoryMovements({
        search: search || undefined,
        type: type || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load inventory logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => {
    void load();
  }, [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#16266b]">
            Inventory Logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            History of all stock movements and adjustments.
          </p>
        </div>
        <form onSubmit={submit} className="relative w-full md:w-96">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search item, serial, or operator..."
            className="h-11 w-full rounded-xl bg-slate-50 pl-10 pr-3 text-sm outline-none"
          />
        </form>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:w-52">
          <Select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Movement Types</option>
            <option value="ADDITION">Addition</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="REMOVAL">Removal</option>
            <option value="RETURN">Return</option>
            <option value="SALE">Sale</option>
            <option value="DAMAGE">Damage</option>
          </Select>
        </div>
        <Button variant="outline" onClick={() => void load()} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-[1000px] w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-400">
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Item Details</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Qty Change</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {logs.length ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100">
                      <td className="p-3">
                        {new Date(log.createdAt).toLocaleDateString()}
                        <p className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="p-3 font-medium text-[#16266b]">
                        {log.itemName}
                        <p className="text-xs font-normal text-slate-400">
                          S/N: {log.serialNumber ?? "N/A"}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                          {log.type}
                        </span>
                      </td>
                      <td
                        className={
                          "p-3 font-semibold " +
                          (log.quantityDelta < 0
                            ? "text-red-600"
                            : "text-emerald-600")
                        }
                      >
                        {log.quantityDelta > 0 ? "+" : ""}
                        {log.quantityDelta}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-50 px-2 py-1 text-xs text-blue-700">
                          {log.performerName ?? "System"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {log.remarks ?? "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-slate-400">
                      No inventory logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{pagination?.total ?? 0} logs</span>
        {(pagination?.totalPages ?? 1) > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {pagination?.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= (pagination?.totalPages ?? 1) || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
