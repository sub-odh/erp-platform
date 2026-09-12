"use client";

import { Eye, EyeOff, Pencil } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { Button, Modal } from "@/components/ui";
import { Avatar } from "@/components/users/avatar";
import { formatCurrency } from "@/lib/currency";
import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeProfileModalProps {
  employee: Employee | null;
  onClose: () => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
}

export function EmployeeProfileModal({
  employee,
  onClose,
  onView,
  onEdit,
}: EmployeeProfileModalProps) {
  const [salaryVisible, setSalaryVisible] = useState(false);

  useEffect(() => {
    setSalaryVisible(false);
  }, [employee?.id]);

  return (
    <Modal
      open={Boolean(employee)}
      title="Full Employee Profile"
      onClose={onClose}
      className="max-w-3xl"
      footer={
        employee ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Close Profile
            </Button>
            <Button variant="outline" onClick={() => onView(employee)}>
              View Full Record
            </Button>
            <Button onClick={() => onEdit(employee)}>
              <Pencil size={16} />
              Edit Employee
            </Button>
          </>
        ) : null
      }
    >
      {employee ? (
        <div className="space-y-5">
          <div className="text-center">
            <div className="flex justify-center">
              <Avatar
                firstName={employee.firstName}
                lastName={employee.lastName}
                src={employee.photoUrl}
                size="xl"
                className="ring-2 ring-blue-100"
              />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {employeeFullName(employee)}
            </h3>
            <p className="mt-1 text-sm font-medium text-blue-600">
              {employee.designation ?? "Staff"}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              Employee Code: {employee.employeeCode}
            </p>
            <div className="mt-3 flex justify-center">
              <EmployeeStatusBadge status={employee.status} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileSection title="Personal & Family">
              <ProfileField label="Father Name" value={employee.fatherName} />
              <ProfileField label="Mother Name" value={employee.motherName} />
              <div className="grid grid-cols-2 gap-4">
                <ProfileField
                  label="Marital Status"
                  value={formatMarital(employee.maritalStatus)}
                />
                <ProfileField label="Spouse Name" value={employee.spouseName} />
              </div>
              <ProfileField
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth)}
              />
            </ProfileSection>

            <ProfileSection title="Legal & Contact">
              <div className="grid grid-cols-2 gap-4">
                <ProfileField
                  label="PAN Number"
                  value={employee.panNumber}
                  emphasis
                />
                <ProfileField
                  label="Citizenship No."
                  value={employee.citizenshipNumber}
                />
              </div>
              <ProfileField label="Work Email" value={employee.workEmail} />
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Primary Phone" value={employee.phone} />
                <ProfileField label="Alt Phone" value={employee.altPhone} />
              </div>
            </ProfileSection>
          </div>

          <ProfileSection title="Professional Background">
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField
                label="Qualification"
                value={employee.qualification}
                fallback="Not specified"
              />
              <ProfileField
                label="Past Experience"
                value={employee.pastExperience}
                fallback="No previous records found"
              />
            </div>
          </ProfileSection>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Employment Status
            </p>
            <div className="grid gap-4 text-center sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Department
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {employee.department || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Joined Date
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(employee.joinDate) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Salary
                </p>
                <button
                  type="button"
                  onClick={() => setSalaryVisible((current) => !current)}
                  className="mx-auto mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-white"
                >
                  <span
                    className={
                      salaryVisible ? undefined : "select-none blur-[5px]"
                    }
                  >
                    {formatCurrency(employee.salary ?? 0)}
                  </span>
                  {salaryVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-slate-50 p-4">
      <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-blue-600">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ProfileField({
  label,
  value,
  emphasis,
  fallback = "—",
}: {
  label: string;
  value?: string | null;
  emphasis?: boolean;
  fallback?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={[
          "mt-0.5 text-sm font-semibold",
          emphasis ? "text-red-600" : "text-slate-800",
        ].join(" ")}
      >
        {value?.trim() || fallback}
      </p>
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMarital(value: Employee["maritalStatus"]): string | null {
  if (value === "SINGLE") return "Single";
  if (value === "MARRIED") return "Married";
  return null;
}
