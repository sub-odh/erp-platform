"use client";

import { IdCard, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmployeeTable } from "@/components/employees/employee-table";
import { Button, Spinner } from "@/components/ui";
import {
  bulkDeleteEmployees,
  deactivateEmployee,
  getEmployees,
} from "@/lib/employees";
import type { Employee } from "@/types/employee";

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = searchParams.get("msg");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(flash);

  const loadEmployees = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getEmployees({
        status: "all",
        page: 1,
        limit: 500,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      setEmployees(result.data);
      setSelectedIds([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employees.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  async function deleteOne(employee: Employee): Promise<void> {
    if (!window.confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) {
      return;
    }

    setError(null);

    try {
      const result = await deactivateEmployee(employee.id);
      setNotice(result.message);
      await loadEmployees();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Error: Could not delete employee. (They might have active records).",
      );
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedIds.length === 0) {
      setError("No employees were selected for deletion.");
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} employee record(s)?`)) {
      return;
    }

    setError(null);

    try {
      const result = await bulkDeleteEmployees(selectedIds);
      setNotice(result.message);
      await loadEmployees();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the selected employees.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <IdCard size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Employee Management
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void deleteSelected()}>
            Delete Selected
          </Button>
          <Button onClick={() => router.push("/hr/employees/new")}>
            <Plus size={17} />
            Add Employee
          </Button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

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
        <EmployeeTable
          employees={employees}
          selectedIds={selectedIds}
          onToggle={(employeeId) => {
            setSelectedIds((current) =>
              current.includes(employeeId)
                ? current.filter((id) => id !== employeeId)
                : [...current, employeeId],
            );
          }}
          onToggleAll={(checked) => {
            setSelectedIds(checked ? employees.map((employee) => employee.id) : []);
          }}
          onEdit={(employee) => router.push(`/hr/employees/${employee.id}/edit`)}
          onDelete={(employee) => void deleteOne(employee)}
        />
      )}
    </div>
  );
}
