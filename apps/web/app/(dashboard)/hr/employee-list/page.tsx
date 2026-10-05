"use client";

import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmployeeDirectoryTable } from "@/components/employees/employee-directory-table";
import { EmployeeProfileModal } from "@/components/employees/employee-profile-modal";
import { Spinner } from "@/components/ui";
import { getEmployees } from "@/lib/employees";
import type { Employee } from "@/types/employee";

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getEmployees({
        status: "active",
        page: 1,
        limit: 500,
        sortBy: "firstName",
        sortDirection: "asc",
      });

      setEmployees(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the employee list.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-0 text-xl font-bold text-slate-900">
            Staff Directory
          </h1>
          <p className="text-sm text-slate-500">
            Manage and view detailed employee profiles
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-blue-600 shadow-sm">
          <Users size={14} className="mr-1" aria-hidden />
          {employees.length} Total Members
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <EmployeeDirectoryTable employees={employees} onProfile={setSelected} />
      )}

      <EmployeeProfileModal
        employee={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
