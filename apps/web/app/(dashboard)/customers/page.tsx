"use client";

import { Plus, RefreshCw, Search, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { CreateCustomerModal } from "@/components/customers/create-customer-modal";
import { CustomerTable } from "@/components/customers/customer-table";
import { Button, Select, Spinner } from "@/components/ui";
import { getCustomers, updateCustomerStatus } from "@/lib/customers";
import type {
  Customer,
  CustomerSortField,
  PaginatedCustomersResponse,
  SortDirection,
} from "@/types/customer";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [pagination, setPagination] = useState<
    PaginatedCustomersResponse["pagination"] | null
  >(null);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [page, setPage] = useState(1);

  const [sortBy, setSortBy] = useState<CustomerSortField>("createdAt");

  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [busyCustomerId, setBusyCustomerId] = useState<string | null>(null);

  const loadCustomers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCustomers({
        search: search || undefined,

        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",

        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDirection,
      });

      setCustomers(result.data);

      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: StatusFilter): void {
    setStatusFilter(value);
    setPage(1);
  }

  function handleSort(field: CustomerSortField): void {
    setPage(1);

    if (sortBy === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortBy(field);
    setSortDirection("asc");
  }

  function openCustomer(customer: Customer): void {
    router.push(`/customers/${customer.id}`);
  }

  async function handleToggleStatus(customer: Customer): Promise<void> {
    setBusyCustomerId(customer.id);

    setError(null);

    try {
      const updated = await updateCustomerStatus(
        customer.id,
        !customer.isActive,
      );

      setCustomers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      if (statusFilter !== "all") {
        await loadCustomers();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update customer status.",
      );
    } finally {
      setBusyCustomerId(null);
    }
  }

  function handleCreated(customer: Customer): void {
    setCreateOpen(false);

    router.push(`/customers/${customer.id}`);
  }

  const total = pagination?.total ?? 0;

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UsersRound size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Manage customer accounts and sales information.
            </p>
          </div>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={17} />
          New customer
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search customers by name, code, email, phone, or tax number..."
                className="h-10 w-full rounded-l-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>

          <div className="w-full lg:w-44">
            <Select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value as StatusFilter)
              }
            >
              <option value="all">All statuses</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadCustomers()}
            disabled={loading}
            aria-label="Refresh customers"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : undefined}
            />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && customers.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          busyCustomerId={busyCustomerId}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          onOpen={openCustomer}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {total === 0
            ? "No customers"
            : `${total} customer${total === 1 ? "" : "s"}`}
        </p>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>

            <span className="px-2 text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <CreateCustomerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
