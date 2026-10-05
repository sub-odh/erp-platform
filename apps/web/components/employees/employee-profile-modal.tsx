"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { employeeFullName } from "@/lib/employees";
import type { Employee } from "@/types/employee";

interface EmployeeProfileModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeProfileModal({
  employee,
  onClose,
}: EmployeeProfileModalProps) {
  const [salaryVisible, setSalaryVisible] = useState(false);

  useEffect(() => {
    setSalaryVisible(false);
  }, [employee?.id]);

  const leave = employee
    ? (
        Number(employee.sickLeaveBal) + Number(employee.casualLeaveBal)
      ).toFixed(1)
    : "0.0";

  return (
    <Modal
      open={Boolean(employee)}
      title="Full Employee Profile"
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <button
          type="button"
          className="w-full rounded-full bg-slate-500 py-2.5 text-sm font-bold text-white hover:bg-slate-600"
          onClick={onClose}
        >
          Close Profile
        </button>
      }
    >
      {employee ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 h-[100px] w-[100px]">
              {employee.photoUrl ? (
                <AuthenticatedImage
                  src={employee.photoUrl}
                  alt=""
                  className="h-full w-full rounded-full border-[3px] border-indigo-500 object-cover shadow"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-4xl font-bold text-white shadow">
                  {(employee.firstName[0] ?? "E").toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="mb-0 text-xl font-bold text-slate-900">
              {employeeFullName(employee)}
            </h3>
            <p className="mb-0 font-medium text-blue-600">
              {employee.designation?.trim() || "Staff"}
            </p>
            <p className="text-xs text-slate-500">
              Employee Code: {employee.employeeCode || employee.id}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileSection title="Personal & Family">
              <ProfileField label="Father's Name" value={employee.fatherName} />
              <ProfileField label="Mother's Name" value={employee.motherName} />
              <div className="grid grid-cols-2 gap-3">
                <ProfileField
                  label="Marital Status"
                  value={formatMarital(employee.maritalStatus)}
                  fallback="Single"
                />
                <ProfileField
                  label="Spouse Name"
                  value={employee.spouseName}
                  fallback="N/A"
                />
              </div>
              <ProfileField
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth)}
              />
            </ProfileSection>

            <ProfileSection title="Legal & Contact">
              <div className="grid grid-cols-2 gap-3">
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
              <ProfileField
                label="Email Address"
                value={employee.workEmail}
                fallback="N/A"
              />
              <div className="grid grid-cols-2 gap-3">
                <ProfileField
                  label="Primary Phone"
                  value={employee.phone}
                  fallback="N/A"
                />
                <ProfileField label="Alt Phone" value={employee.altPhone} />
              </div>
            </ProfileSection>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-indigo-500">
              Professional Background
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <ProfileField
                label="Qualification"
                value={employee.qualification}
                fallback="Not Specified"
              />
              <ProfileField
                label="Past Experiences"
                value={employee.pastExperience}
                fallback="No previous records found"
                muted
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Employment Status
            </h4>
            <div className="grid gap-3 text-center sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </p>
                <p className="font-bold text-slate-900">
                  {employee.department?.trim() || "General"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Joined Date
                </p>
                <p className="font-bold text-slate-900">
                  {formatDate(employee.joinDate) ?? "---"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Salary
                </p>
                <button
                  type="button"
                  onClick={() => setSalaryVisible((current) => !current)}
                  className="inline-flex items-center rounded px-2 py-0.5 font-bold text-emerald-600 hover:bg-slate-100"
                >
                  <span className={salaryVisible ? undefined : "select-none blur-[5px]"}>
                    {formatCurrency(employee.salary ?? 0)}
                  </span>
                  {salaryVisible ? (
                    <Eye size={14} className="ml-1 text-slate-400" aria-hidden />
                  ) : (
                    <EyeOff size={14} className="ml-1 text-slate-400" aria-hidden />
                  )}
                </button>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Leave Bal.
                </p>
                <span className="inline-flex rounded-full bg-blue-600 px-3 py-0.5 text-sm font-semibold text-white">
                  {leave} Days
                </span>
                <p className="mt-1 text-xs text-slate-500">(Sick + Casual)</p>
              </div>
            </div>
          </section>
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
    <section className="h-full rounded-2xl bg-slate-50 p-4">
      <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-blue-600">
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
  muted,
  fallback = "---",
}: {
  label: string;
  value?: string | null;
  emphasis?: boolean;
  muted?: boolean;
  fallback?: string;
}) {
  return (
    <div>
      <p className="mb-0.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={[
          "block text-sm",
          muted ? "font-normal text-slate-500" : "font-semibold",
          emphasis ? "text-red-600" : muted ? "" : "text-slate-900",
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
