"use client";

import {
  Boxes,
  Layers3,
  Pencil,
  Plus,
  Ruler,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ProductModal } from "@/components/master-data/product-modal";
import { SimpleMasterModal } from "@/components/master-data/simple-master-modal";
import { Button, Select, Spinner } from "@/components/ui";
import { formatRupees } from "@/lib/inventory-format";
import {
  archiveCategory,
  archiveProduct,
  archiveUnit,
  getCategories,
  getMasterDataOptions,
  getProducts,
  getUnits,
} from "@/lib/master-data";
import type {
  MasterDataOptions,
  PaginationMeta,
  Product,
  ProductCategory,
  ProductUnit,
} from "@/types/master-data";

type Tab = "products" | "categories" | "units";
const PAGE_SIZE = 20;
const emptyOptions: MasterDataOptions = {
  categories: [],
  units: [],
  vendors: [],
};

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [options, setOptions] = useState<MasterDataOptions>(emptyOptions);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      search: search || undefined,
      isActive:
        status === "active" ? true : status === "inactive" ? false : undefined,
      page,
      limit: PAGE_SIZE,
    };
    try {
      if (tab === "products") {
        const [result, masterOptions] = await Promise.all([
          getProducts(params),
          getMasterDataOptions(),
        ]);
        setProducts(result.data);
        setPagination(result.pagination);
        setOptions(masterOptions);
      } else if (tab === "categories") {
        const [result, masterOptions] = await Promise.all([
          getCategories(params),
          getMasterDataOptions(),
        ]);
        setCategories(result.data);
        setPagination(result.pagination);
        setOptions(masterOptions);
      } else {
        const [result, masterOptions] = await Promise.all([
          getUnits(params),
          getMasterDataOptions(),
        ]);
        setUnits(result.data);
        setPagination(result.pagination);
        setOptions(masterOptions);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load product master data.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, tab]);

  useEffect(() => void load(), [load]);

  function chooseTab(next: Tab) {
    setTab(next);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setStatus("");
    setError(null);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function openCreate() {
    if (tab === "products") {
      setEditingProduct(null);
      setProductModalOpen(true);
    } else if (tab === "categories") {
      setEditingCategory(null);
      setCategoryModalOpen(true);
    } else {
      setEditingUnit(null);
      setUnitModalOpen(true);
    }
  }

  async function archive(record: Product | ProductCategory | ProductUnit) {
    if (!window.confirm(`Archive ${record.name}?`)) return;
    setBusyId(record.id);
    setError(null);
    try {
      if (tab === "products") await archiveProduct(record.id);
      else if (tab === "categories") await archiveCategory(record.id);
      else await archiveUnit(record.id);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive this record.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const total = pagination?.total ?? 0;
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Boxes size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-[#16266b]">
                Products & Catalog
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Company-wide product, category, and unit master data.
              </p>
            </div>
          </div>
        </div>
        <Button className="rounded-full px-5" onClick={openCreate}>
          <Plus size={17} /> Add{" "}
          {tab === "products"
            ? "Product"
            : tab === "categories"
              ? "Category"
              : "Unit"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
          <TabButton
            active={tab === "products"}
            onClick={() => chooseTab("products")}
            icon={<Boxes size={16} />}
            label="Products"
          />
          <TabButton
            active={tab === "categories"}
            onClick={() => chooseTab("categories")}
            icon={<Layers3 size={16} />}
            label="Categories"
          />
          <TabButton
            active={tab === "units"}
            onClick={() => chooseTab("units")}
            icon={<Ruler size={16} />}
            label="Units"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={submitSearch} className="relative min-w-64">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={`Search ${tab}...`}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </form>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
            className="min-w-36 rounded-full py-2"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {tab === "products" &&
      (options.categories.length === 0 || options.units.length === 0) ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add at least one active category and unit before registering products.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-[#16266b]">
            {total} {tab}
          </p>
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : tab === "products" ? (
          <ProductsTable
            records={products}
            page={page}
            busyId={busyId}
            onEdit={(record) => {
              setEditingProduct(record);
              setProductModalOpen(true);
            }}
            onArchive={archive}
          />
        ) : tab === "categories" ? (
          <CategoriesTable
            records={categories}
            page={page}
            busyId={busyId}
            onEdit={(record) => {
              setEditingCategory(record);
              setCategoryModalOpen(true);
            }}
            onArchive={archive}
          />
        ) : (
          <UnitsTable
            records={units}
            page={page}
            busyId={busyId}
            onEdit={(record) => {
              setEditingUnit(record);
              setUnitModalOpen(true);
            }}
            onArchive={archive}
          />
        )}
      </div>

      <Pagination
        page={page}
        meta={pagination}
        loading={loading}
        onPage={setPage}
      />

      <ProductModal
        open={productModalOpen}
        product={editingProduct}
        options={options}
        onClose={() => setProductModalOpen(false)}
        onSaved={() => void load()}
      />
      <SimpleMasterModal
        kind="category"
        open={categoryModalOpen}
        record={editingCategory}
        onClose={() => setCategoryModalOpen(false)}
        onSaved={() => void load()}
      />
      <SimpleMasterModal
        kind="unit"
        open={unitModalOpen}
        record={editingUnit}
        onClose={() => setUnitModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Actions<T extends { id: string }>({
  record,
  busyId,
  onEdit,
  onArchive,
}: {
  record: T;
  busyId: string | null;
  onEdit: (record: T) => void;
  onArchive: (record: T) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        size="icon"
        variant="ghost"
        title="Edit"
        onClick={() => onEdit(record)}
      >
        <Pencil size={16} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Archive"
        disabled={busyId === record.id}
        className="text-red-600 hover:bg-red-50"
        onClick={() => onArchive(record)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

function ProductsTable({
  records,
  page,
  busyId,
  onEdit,
  onArchive,
}: {
  records: Product[];
  page: number;
  busyId: string | null;
  onEdit: (record: Product) => void;
  onArchive: (record: Product) => void;
}) {
  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-[#9aa7d3]">
            <th className="px-4 py-4">S.No.</th>
            <th className="px-4 py-4">Product</th>
            <th className="px-4 py-4">Category</th>
            <th className="px-4 py-4">Unit</th>
            <th className="px-4 py-4">Default Vendor</th>
            <th className="px-4 py-4">Purchase</th>
            <th className="px-4 py-4">Selling</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <Empty colSpan={9} />
          ) : (
            records.map((record, index) => (
              <tr
                key={record.id}
                className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#16266b]">{record.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{record.sku}</p>
                </td>
                <td className="px-4 py-4">{record.categoryName}</td>
                <td className="px-4 py-4">{record.unitSymbol}</td>
                <td className="px-4 py-4">{record.defaultVendorName ?? "—"}</td>
                <td className="px-4 py-4">
                  {formatRupees(record.purchasePrice)}
                </td>
                <td className="px-4 py-4">
                  {formatRupees(record.sellingPrice)}
                </td>
                <td className="px-4 py-4">
                  <Status active={record.isActive} />
                </td>
                <td className="px-4 py-4">
                  <Actions
                    record={record}
                    busyId={busyId}
                    onEdit={onEdit}
                    onArchive={onArchive}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesTable({
  records,
  page,
  busyId,
  onEdit,
  onArchive,
}: {
  records: ProductCategory[];
  page: number;
  busyId: string | null;
  onEdit: (record: ProductCategory) => void;
  onArchive: (record: ProductCategory) => void;
}) {
  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-[#9aa7d3]">
            <th className="px-4 py-4">S.No.</th>
            <th className="px-4 py-4">Code</th>
            <th className="px-4 py-4">Category Name</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <Empty colSpan={5} />
          ) : (
            records.map((record, index) => (
              <tr
                key={record.id}
                className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="px-4 py-4 font-mono text-xs font-semibold text-blue-700">
                  {record.code}
                </td>
                <td className="px-4 py-4 font-semibold text-[#16266b]">
                  {record.name}
                </td>
                <td className="px-4 py-4">
                  <Status active={record.isActive} />
                </td>
                <td className="px-4 py-4">
                  <Actions
                    record={record}
                    busyId={busyId}
                    onEdit={onEdit}
                    onArchive={onArchive}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UnitsTable({
  records,
  page,
  busyId,
  onEdit,
  onArchive,
}: {
  records: ProductUnit[];
  page: number;
  busyId: string | null;
  onEdit: (record: ProductUnit) => void;
  onArchive: (record: ProductUnit) => void;
}) {
  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-[#9aa7d3]">
            <th className="px-4 py-4">S.No.</th>
            <th className="px-4 py-4">Unit Name</th>
            <th className="px-4 py-4">Symbol</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <Empty colSpan={5} />
          ) : (
            records.map((record, index) => (
              <tr
                key={record.id}
                className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="px-4 py-4 font-semibold text-[#16266b]">
                  {record.name}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">
                    {record.symbol}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Status active={record.isActive} />
                </td>
                <td className="px-4 py-4">
                  <Actions
                    record={record}
                    busyId={busyId}
                    onEdit={onEdit}
                    onArchive={onArchive}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-32 text-center text-slate-400">
        No data available in table
      </td>
    </tr>
  );
}

function Pagination({
  page,
  meta,
  loading,
  onPage,
}: {
  page: number;
  meta: PaginationMeta | null;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  if ((meta?.totalPages ?? 0) <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-3 text-sm text-slate-500">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1 || loading}
        onClick={() => onPage(page - 1)}
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
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
