"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { InventoryAssetModal } from "@/components/inventory/inventory-asset-modal";
import { Button, Select, Spinner } from "@/components/ui";
import {
  archiveInventoryAsset,
  downloadTextFile,
  exportInventoryCsv,
  getInventoryAssets,
} from "@/lib/inventory";
import {
  formatRupees,
  inventoryStatusClasses,
  inventoryStatusLabel,
} from "@/lib/inventory-format";
import type {
  InventoryAsset,
  InventoryAssetStatus,
  InventoryListResponse,
  InventorySortField,
  InventorySortDirection,
} from "@/types/inventory";

const PAGE_SIZE = 20;

export default function InventoryMasterPage() {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [meta, setMeta] = useState<InventoryListResponse["pagination"] | null>(
    null,
  );
  const [totals, setTotals] = useState<InventoryListResponse["totals"]>({
    purchaseValue: 0,
    mrpValue: 0,
    stockQuantity: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InventoryAssetStatus | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<InventorySortField>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<InventorySortDirection>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryAsset | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInventoryAssets({
        search: search || undefined,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDirection,
      });
      setAssets(result.data);
      setMeta(result.pagination);
      setTotals(result.totals);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortDirection, status]);

  useEffect(() => void load(), [load]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }
  function sort(field: InventorySortField) {
    setPage(1);
    if (field === sortBy)
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDirection("asc");
    }
  }
  async function archive(asset: InventoryAsset) {
    if (
      !window.confirm(
        `Archive ${asset.itemName}? Its movement history will be retained.`,
      )
    )
      return;
    setBusyId(asset.id);
    setError(null);
    try {
      await archiveInventoryAsset(asset.id);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive asset.",
      );
    } finally {
      setBusyId(null);
    }
  }
  async function exportExcel() {
    try {
      downloadTextFile(
        await exportInventoryCsv({
          search: search || undefined,
          status: status || undefined,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to export inventory.",
      );
    }
  }
  function printPdf() {
    const popup = window.open("", "inventory-report", "width=1100,height=800");
    if (!popup) {
      setError("Allow pop-ups to export the PDF report.");
      return;
    }
    const rows = assets
      .map(
        (asset, index) =>
          `<tr><td>${index + 1}</td><td>${escapeHtml(asset.itemName)}<small>${escapeHtml(asset.category)}</small></td><td>${escapeHtml(asset.serialNumber ?? "—")}</td><td>${formatRupees(asset.purchasePrice)}</td><td>${formatRupees(asset.mrpPrice)}</td><td>${asset.stockQuantity}</td><td>${escapeHtml(inventoryStatusLabel(asset.status))}</td></tr>`,
      )
      .join("");
    popup.document.write(
      `<html><head><title>Inventory Master</title><style>body{font:14px Arial;padding:28px;color:#172554}h1{margin-bottom:4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{background:#f1f5f9;font-size:11px;text-transform:uppercase}small{display:block;color:#94a3b8;margin-top:3px}tfoot{font-weight:bold}</style></head><body><h1>Inventory Master</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr><th>S.No.</th><th>Item & Category</th><th>Serial No</th><th>Purchase Price</th><th>MRP Price</th><th>Qty</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No inventory data</td></tr>'}</tbody><tfoot><tr><td colspan="3">Grand Totals</td><td>${formatRupees(totals.purchaseValue)}</td><td>${formatRupees(totals.mrpValue)}</td><td>${totals.stockQuantity}</td><td></td></tr></tfoot></table><script>window.onload=()=>window.print()</script></body></html>`,
    );
    popup.document.close();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-[#16266b]">
            Inventory Master
          </h1>
          <Link
            href="/inventory"
            className="mt-5 inline-flex items-center gap-1 text-sm text-slate-700 hover:text-blue-600"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="mt-2 inline-flex rounded-xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#9aa7d3] shadow-md">
            Total in stock{" "}
            <span className="ml-3 text-lg text-[#16266b]">
              {totals.stockQuantity}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={submitSearch}
            className="relative min-w-64 flex-1 sm:flex-none"
          >
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search item or serial..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none shadow-lg focus:border-blue-500"
            />
          </form>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <Filter size={15} /> Filter
          </Button>
          <Button
            size="sm"
            variant="success"
            className="rounded-full"
            onClick={() => void exportExcel()}
          >
            <FileSpreadsheet size={16} /> Excel
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="rounded-full"
            onClick={printPdf}
          >
            <FileDown size={16} /> PDF
          </Button>
          <Link href="/inventory">
            <Button size="sm" className="rounded-full">
              <LayoutDashboard size={16} /> Dashboard
            </Button>
          </Link>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Register
          </Button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="ml-auto max-w-xs rounded-xl bg-white p-3 shadow-lg">
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as InventoryAssetStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="SOLD">Sold</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETURNED">Returned</option>
            <option value="RMA">RMA</option>
          </Select>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        {loading && assets.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-[#9aa7d3]">
                  <th className="px-4 py-4">S.No.</th>
                  <Sortable
                    label="Item & Category"
                    field="itemName"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <Sortable
                    label="Serial No"
                    field="serialNumber"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <Sortable
                    label="Purchase Price"
                    field="purchasePrice"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <Sortable
                    label="MRP Price"
                    field="mrpPrice"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <th className="px-4 py-4">Source</th>
                  <Sortable
                    label="Qty"
                    field="stockQuantity"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <Sortable
                    label="Status"
                    field="status"
                    active={sortBy}
                    direction={sortDirection}
                    onSort={sort}
                  />
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-24 text-center text-[#16266b]">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  assets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#16266b]">
                          {asset.itemName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {asset.category}
                          {asset.vendor ? ` · ${asset.vendor}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">{asset.serialNumber ?? "—"}</td>
                      <td className="px-4 py-4">
                        {formatRupees(asset.purchasePrice)}
                      </td>
                      <td className="px-4 py-4">
                        {formatRupees(asset.mrpPrice)}
                      </td>
                      <td className="px-4 py-4">
                        {asset.purchaseSource ?? "—"}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {asset.stockQuantity}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${inventoryStatusClasses(asset.status)}`}
                        >
                          {inventoryStatusLabel(asset.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit asset"
                            onClick={() => {
                              setEditing(asset);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Archive asset"
                            disabled={busyId === asset.id}
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => void archive(asset)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#f7f8fc] font-semibold text-[#16266b]">
                  <td colSpan={3} className="px-4 py-4 text-right uppercase">
                    Grand Totals:
                  </td>
                  <td className="px-4 py-4">
                    {formatRupees(totals.purchaseValue)}
                  </td>
                  <td className="px-4 py-4">
                    {formatRupees(totals.mrpValue)}
                  </td>
                  <td></td>
                  <td className="px-4 py-4">{totals.stockQuantity}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{meta?.total ?? 0} assets</span>
        {(meta?.totalPages ?? 1) > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {meta?.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (meta?.totalPages ?? 1) || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <InventoryAssetModal
        open={modalOpen}
        asset={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}

function Sortable({
  label,
  field,
  active,
  direction,
  onSort,
}: {
  label: string;
  field: InventorySortField;
  active: InventorySortField;
  direction: InventorySortDirection;
  onSort: (field: InventorySortField) => void;
}) {
  return (
    <th className="px-4 py-4">
      <button
        className="inline-flex items-center gap-1 uppercase"
        onClick={() => onSort(field)}
      >
        {label}
        {active === field ? (
          direction === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <span className="text-slate-200">↕</span>
        )}
      </button>
    </th>
  );
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
}
