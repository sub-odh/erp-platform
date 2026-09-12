"use client";

import { Eye, Pencil } from "lucide-react";

import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { Avatar } from "@/components/users/avatar";
import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeDirectoryTableProps {
  employees: Employee[];
  onProfile: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
}

export function EmployeeDirectoryTable({
  employees,
  onProfile,
  onEdit,
}: EmployeeDirectoryTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No employees found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try changing the search or filters. Results stay inside this company.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact & Email
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                PAN Number
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Designation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="bg-white transition hover:bg-indigo-50/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={employee.firstName}
                      lastName={employee.lastName}
                      src={employee.photoUrl}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employeeFullName(employee)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        ID: #{employee.employeeCode}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">
                    {employee.phone ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {employee.workEmail ?? "N/A"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-semibold text-slate-600">
                    {employee.panNumber ?? "—"}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {employee.designation ?? "Staff"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EmployeeStatusBadge status={employee.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                      onClick={() => onProfile(employee)}
                    >
                      <Eye size={14} className="text-blue-600" />
                      Profile
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                      onClick={() => onEdit(employee)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
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
