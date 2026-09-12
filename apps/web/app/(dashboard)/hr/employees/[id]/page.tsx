"use client";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { AuthenticatedImage } from "@/components/media";
import { Button, ConfirmDialog, Spinner } from "@/components/ui";
import { Avatar } from "@/components/users/avatar";
import { formatCurrency } from "@/lib/currency";
import {
  deactivateEmployee,
  employeeFullName,
  getEmployee,
  restoreEmployee,
} from "@/lib/employees";
import type { Employee } from "@/types/employee";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployee = useCallback(async (): Promise<void> => {
    if (!employeeId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setEmployee(await getEmployee(employeeId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this employee.",
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  async function handleStatusChange(): Promise<void> {
    if (!employee) {
      return;
    }

    setStatusBusy(true);
    setError(null);

    try {
      const updated =
        employee.status === "ACTIVE"
          ? await deactivateEmployee(employee.id)
          : await restoreEmployee(employee.id);

      setEmployee(updated);
      setConfirmOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update employee status.",
      );
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading && !employee) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-5">
        <Button variant="outline" onClick={() => router.push("/hr/employees")}>
          <ArrowLeft size={17} />
          Employees
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error ?? "Employee not found."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/hr/employees")}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Employee Management
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              firstName={employee.firstName}
              lastName={employee.lastName}
              src={employee.photoUrl}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {employeeFullName(employee)}
                </h1>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="font-mono">{employee.employeeCode}</span>
                {employee.designation ? (
                  <>
                    <span>•</span>
                    <span>{employee.designation}</span>
                  </>
                ) : null}
                {employee.department ? (
                  <>
                    <span>•</span>
                    <span>{employee.department}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/hr/employees/${employee.id}/edit`)}
            >
              <Pencil size={17} />
              Edit Employee
            </Button>
            <Button
              variant={employee.status === "ACTIVE" ? "danger" : "success"}
              onClick={() => setConfirmOpen(true)}
            >
              {employee.status === "ACTIVE" ? "Deactivate" : "Restore"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <InfoCard title="Job Information" icon={Briefcase}>
              <InfoGrid>
                <InfoItem label="Employee Code" value={employee.employeeCode} />
                <InfoItem label="Designation" value={employee.designation} />
                <InfoItem label="Department" value={employee.department} />
                <InfoItem
                  label="Reporting Manager"
                  value={
                    employee.manager
                      ? `${employee.manager.employeeCode} — ${employee.manager.firstName} ${employee.manager.lastName}`
                      : null
                  }
                />
                <InfoItem label="Joining Date" value={formatDate(employee.joinDate)} />
                <InfoItem
                  label="Resignation Date"
                  value={formatDate(employee.resignationDate)}
                />
                <InfoItem
                  label="Salary"
                  value={
                    employee.salary != null
                      ? formatCurrency(employee.salary)
                      : null
                  }
                />
                <InfoItem
                  label="Last Increment Month"
                  value={employee.lastIncrementMonth}
                />
                <InfoItem
                  label="Attendance Device ID"
                  value={
                    employee.attendanceDeviceId != null
                      ? String(employee.attendanceDeviceId)
                      : null
                  }
                />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Personal Information" icon={UserRound}>
              <InfoGrid>
                <InfoItem
                  label="Date of Birth"
                  value={formatDate(employee.dateOfBirth)}
                />
                <InfoItem label="Gender" value={formatGender(employee.gender)} />
                <InfoItem
                  label="Marital Status"
                  value={formatMarital(employee.maritalStatus)}
                />
                <InfoItem label="Spouse Name" value={employee.spouseName} />
                <InfoItem label="Father Name" value={employee.fatherName} />
                <InfoItem label="Mother Name" value={employee.motherName} />
                <InfoItem
                  label="Citizenship Number"
                  value={employee.citizenshipNumber}
                />
                <InfoItem label="PAN Number" value={employee.panNumber} />
              </InfoGrid>
            </InfoCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <InfoCard title="Permanent Address" icon={MapPin}>
                <AddressValue value={employee.permanentAddress} />
              </InfoCard>
              <InfoCard title="Current Address" icon={Building2}>
                <AddressValue value={employee.currentAddress} />
              </InfoCard>
            </div>

            <InfoCard title="Bank Details" icon={CreditCard}>
              <InfoGrid>
                <InfoItem label="Bank Name" value={employee.bankName} />
                <InfoItem label="Bank Branch" value={employee.bankBranch} />
                <InfoItem
                  label="Bank Account Name"
                  value={employee.bankAccountName}
                />
                <InfoItem
                  label="Bank Account Number"
                  value={employee.bankAccountNumber}
                />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Qualification and Experience">
              <div className="grid gap-5 md:grid-cols-2">
                <LongText
                  label="Qualification"
                  value={employee.qualification}
                />
                <LongText
                  label="Past Experience"
                  value={employee.pastExperience}
                />
              </div>
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard title="Contact" icon={Phone}>
              <div className="space-y-4">
                <InfoItem label="Work Email" icon={Mail} value={employee.workEmail} />
                <InfoItem label="Phone" icon={Phone} value={employee.phone} />
                <InfoItem label="Alternate Phone" value={employee.altPhone} />
              </div>
            </InfoCard>

            <InfoCard title="Emergency Contact" icon={Shield}>
              <div className="space-y-4">
                <InfoItem label="Name" value={employee.emergencyContactName} />
                <InfoItem label="Phone" value={employee.emergencyContactPhone} />
                <InfoItem
                  label="Relation"
                  value={employee.emergencyContactRelation}
                />
              </div>
            </InfoCard>

            <InfoCard title="Linked User Account">
              {employee.user ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-slate-900">
                    {employee.user.firstName} {employee.user.lastName}
                  </p>
                  <p className="text-slate-500">{employee.user.email}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    System Role: {employee.user.role}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No login account is linked to this employee.
                </p>
              )}
            </InfoCard>

            <InfoCard title="Sales Targets">
              {employee.hasSalesTarget ? (
                <div className="space-y-4">
                  <InfoItem
                    label="Sales Target"
                    value={
                      employee.salesTarget != null
                        ? formatCurrency(employee.salesTarget)
                        : null
                    }
                  />
                  <InfoItem
                    label="Yearly Sales Target"
                    value={
                      employee.yearlySalesTarget != null
                        ? formatCurrency(employee.yearlySalesTarget)
                        : null
                    }
                  />
                  <InfoItem
                    label="Target Start Date"
                    value={formatDate(employee.targetStartDate)}
                  />
                  <InfoItem
                    label="Target End Date"
                    value={formatDate(employee.targetEndDate)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  This employee does not have a sales target.
                </p>
              )}
            </InfoCard>

            {employee.signatureUrl ? (
              <InfoCard title="Signature">
                <AuthenticatedImage
                  src={employee.signatureUrl}
                  alt={`${employeeFullName(employee)} signature`}
                  className="max-h-28 rounded-lg border border-slate-200 bg-white object-contain p-2"
                />
              </InfoCard>
            ) : null}

            <InfoCard title="Record Information" icon={CalendarDays}>
              <div className="space-y-4">
                <InfoItem
                  label="Created"
                  value={formatDateTime(employee.createdAt)}
                />
                <InfoItem
                  label="Updated"
                  value={formatDateTime(employee.updatedAt)}
                />
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={
          employee.status === "ACTIVE"
            ? "Deactivate Employee"
            : "Restore Employee"
        }
        description={
          employee.status === "ACTIVE"
            ? "This employee will be marked inactive and hidden from active HR workflows."
            : "This employee will be restored to the active company roster."
        }
        confirmLabel={employee.status === "ACTIVE" ? "Deactivate" : "Restore"}
        destructive={employee.status === "ACTIVE"}
        loading={statusBusy}
        onConfirm={() => void handleStatusChange()}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Briefcase;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        {Icon ? <Icon size={18} className="text-blue-600" /> : null}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: typeof Mail;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-800">
        {Icon ? <Icon size={15} className="text-slate-400" /> : null}
        {value || "—"}
      </p>
    </div>
  );
}

function AddressValue({ value }: { value: string | null }) {
  return value ? (
    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{value}</p>
  ) : (
    <p className="text-sm text-slate-500">No address has been added.</p>
  );
}

function LongText({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {value ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {value}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Not provided.</p>
      )}
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGender(value: Employee["gender"]): string | null {
  if (value === "MALE") return "Male";
  if (value === "FEMALE") return "Female";
  if (value === "OTHERS") return "Others";
  return null;
}

function formatMarital(value: Employee["maritalStatus"]): string | null {
  if (value === "SINGLE") return "Single";
  if (value === "MARRIED") return "Married";
  return null;
}
