"use client";

import { ClipboardList, RefreshCw, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { EmployeeDirectoryTable } from "@/components/employees/employee-directory-table";
import { EmployeeProfileModal } from "@/components/employees/employee-profile-modal";
import { Button, Select, Spinner } from "@/components/ui";
import { getEmployeeLookups, getEmployees } from "@/lib/employees";
import type {
  Employee,
  EmployeeListCounts,
  EmployeeListStatus,
  EmployeeLookups,
} from "@/types/employee";

const emptyCounts: EmployeeListCounts = {
  active: 0,
  inactive: 0,
  total: 0,
};

export default function EmployeeListPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lookups, setLookups] = useState<EmployeeLookups | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<EmployeeListStatus>("active");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<EmployeeListCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getEmployees({
        status,
        search: searchQuery || undefined,
        department: department || undefined,
        designation: designation || undefined,
        page,
        limit: 20,
        sortBy: "firstName",
        sortDirection: "asc",
      });

      setEmployees(result.data);
      setCounts(result.counts);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the employee list.",
      );
    } finally {
      setLoading(false);
    }
  }, [department, designation, page, searchQuery, status]);

  useEffect(() => {
    void getEmployeeLookups()
      .then(setLookups)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              All Employee List
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage and view detailed employee profiles.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm">
          <Users size={15} />
          {counts.total} Total Members
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusTab
          active={status === "active"}
          label="Active"
          count={counts.active}
          onClick={() => {
            setStatus("active");
            setPage(1);
          }}
        />
        <StatusTab
          active={status === "inactive"}
          label="Inactive"
          count={counts.inactive}
          onClick={() => {
            setStatus("inactive");
            setPage(1);
          }}
        />
        <StatusTab
          active={status === "all"}
          label="All"
          count={counts.total}
          onClick={() => {
            setStatus("all");
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by code, name, email, phone, PAN, department, or designation"
                className="h-10 w-full rounded-l-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            <Select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {(lookups?.departments ?? []).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              value={designation}
              onChange={(event) => {
                setDesignation(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Designations</option>
              {(lookups?.designations ?? []).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadEmployees()}
            disabled={loading}
            aria-label="Refresh Employee List"
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

      {loading && employees.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <EmployeeDirectoryTable
          employees={employees}
          onProfile={setSelected}
          onEdit={(employee) => router.push(`/hr/employees/${employee.id}/edit`)}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {total === 0
            ? "No employees"
            : `${total} employee${total === 1 ? "" : "s"} · Page ${page} of ${totalPages}`}
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

      <EmployeeProfileModal
        employee={selected}
        onClose={() => setSelected(null)}
        onView={(employee) => router.push(`/hr/employees/${employee.id}`)}
        onEdit={(employee) => router.push(`/hr/employees/${employee.id}/edit`)}
      />
    </div>
  );
}

function StatusTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}
