"use client";

import { Pencil, Trash2 } from "lucide-react";

import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeTableProps {
  employees: Employee[];
  selectedIds: string[];
  onToggle: (employeeId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function roleLabel(role: string | undefined): string {
  if (!role) {
    return "None";
  }

  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function EmployeeTable({
  employees,
  selectedIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No employees found</p>
      </div>
    );
  }

  const allSelected = employees.every((employee) =>
    selectedIds.includes(employee.id),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleAll(event.target.checked)}
                  aria-label="Select all employees"
                />
              </th>
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Reporting Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => {
              const initial = employee.firstName.trim().charAt(0).toUpperCase();

              return (
                <tr key={employee.id} className="bg-white">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(employee.id)}
                      onChange={() => onToggle(employee.id)}
                      aria-label={`Select ${employeeFullName(employee)}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {initial || "?"}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900">
                          {employeeFullName(employee)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.phone ?? "No Phone"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {employee.employeeCode || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div>{employee.designation ?? "N/A"}</div>
                    <div className="text-xs text-slate-500">
                      System: {roleLabel(employee.user?.role)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {employee.department ?? "General"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {employee.manager
                      ? employeeFullName(employee.manager)
                      : "Director / Head"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold uppercase text-slate-700">
                    {employee.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={() => onEdit(employee)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        onClick={() => onDelete(employee)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
