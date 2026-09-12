"use client";

import { Pencil, ChevronRight } from "lucide-react";

import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { Avatar } from "@/components/users/avatar";
import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeTableProps {
  employees: Employee[];
  onOpen: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeeTable({
  employees,
  onOpen,
  onEdit,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No employees found</p>
        <p className="mt-1 text-sm text-slate-500">
          Add an employee or adjust the search and filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Joining Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="cursor-pointer bg-white transition hover:bg-slate-50"
                onClick={() => onOpen(employee)}
              >
                <td className="px-4 py-3 font-mono text-slate-700">
                  {employee.employeeCode}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={employee.firstName}
                      lastName={employee.lastName}
                      src={employee.photoUrl}
                      size="md"
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        {employeeFullName(employee)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {employee.workEmail ?? employee.phone ?? "No contact"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {employee.department ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {employee.designation ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(employee.joinDate)}
                </td>
                <td className="px-4 py-3">
                  <EmployeeStatusBadge status={employee.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(employee);
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <span className="inline-flex h-9 w-9 items-center justify-center text-slate-400">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
