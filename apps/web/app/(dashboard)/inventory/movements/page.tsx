"use client";

import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, Select, Spinner } from "@/components/ui";
import { getInventoryMovements } from "@/lib/inventory";
import type {
  InventoryMovement,
  InventoryMovementsResponse,
} from "@/types/inventory";

const PAGE_SIZE = 20;

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
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
      setMovements(result.data);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load stock movements.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => void load(), [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/inventory"
            className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} /> Inventory
          </Link>
          <h1 className="text-2xl font-semibold text-[#16266b]">
            Stock Movements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable history of inventory additions, adjustments, and removals.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : undefined}
          />{" "}
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row">
        <form onSubmit={submit} className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search item or serial..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </form>
        <div className="sm:w-52">
          <Select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All movement types</option>
            <option value="ADDITION">Addition</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="REMOVAL">Removal</option>
            <option value="RETURN">Return</option>
            <option value="SALE">Sale</option>
            <option value="DAMAGE">Damage</option>
          </Select>
        </div>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        {loading && movements.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Item</th>
                  <th className="px-5 py-4">Serial</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Change</th>
                  <th className="px-5 py-4">Stock After</th>
                  <th className="px-5 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-28 text-center text-slate-500">
                      No stock movements recorded.
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-slate-100 text-slate-700"
                    >
                      <td className="px-5 py-4">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#16266b]">
                        {movement.itemName}
                      </td>
                      <td className="px-5 py-4">
                        {movement.serialNumber ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {movement.type}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-4 font-semibold ${movement.quantityDelta < 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {movement.quantityDelta > 0 ? "+" : ""}
                        {movement.quantityDelta}
                      </td>
                      <td className="px-5 py-4">
                        {movement.stockQuantityAfter}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {movement.remarks ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{pagination?.total ?? 0} movements</span>
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
