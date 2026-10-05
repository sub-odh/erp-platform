"use client";

import { Eye } from "lucide-react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeDirectoryTableProps {
  employees: Employee[];
  onProfile: (employee: Employee) => void;
}

export function EmployeeDirectoryTable({
  employees,
  onProfile,
}: EmployeeDirectoryTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
        No employees found.
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
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Leave Bal.
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="border-t border-slate-100 transition hover:bg-indigo-50/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center">
                    <StaffAvatar employee={employee} />
                    <div>
                      <p className="mb-0 font-bold text-slate-900">
                        {employeeFullName(employee)}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: #{employee.employeeCode || employee.id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">
                    {employee.phone?.trim() || "---"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {employee.workEmail?.trim() || "N/A"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-bold text-slate-500">
                    {employee.panNumber?.trim() || "---"}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-500">
                    {employee.designation?.trim() || "Staff"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-bold text-slate-900">
                    {leaveDays(employee)}
                  </span>
                  <span className="text-sm text-slate-500"> d</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm hover:bg-slate-50"
                    onClick={() => onProfile(employee)}
                  >
                    <Eye size={14} className="mr-1 text-blue-600" aria-hidden />
                    Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffAvatar({ employee }: { employee: Employee }) {
  const letter = (employee.firstName[0] ?? "E").toUpperCase();

  return (
    <div className="mr-3 h-[45px] w-[45px] shrink-0">
      {employee.photoUrl ? (
        <AuthenticatedImage
          src={employee.photoUrl}
          alt=""
          className="h-full w-full rounded-full border-2 border-white object-cover shadow"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-blue-600 text-lg font-bold text-white shadow">
          {letter}
        </div>
      )}
    </div>
  );
}

function leaveDays(employee: Employee): string {
  const total =
    Number(employee.sickLeaveBal) + Number(employee.casualLeaveBal);

  return Number.isFinite(total) ? total.toFixed(1) : "0.0";
}
