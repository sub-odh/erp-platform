"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmployeeForm } from "@/components/employees/employee-form";
import { Button, Spinner } from "@/components/ui";
import {
  getEmployee,
  getEmployeeLookups,
  removeEmployeePhoto,
  removeEmployeeSignature,
  updateEmployee,
  uploadEmployeePhoto,
  uploadEmployeeSignature,
} from "@/lib/employees";
import type { Employee, EmployeeLookups } from "@/types/employee";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [lookups, setLookups] = useState<EmployeeLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!employeeId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [record, lookupResult] = await Promise.all([
        getEmployee(employeeId),
        getEmployeeLookups(employeeId),
      ]);

      setEmployee(record);
      setLookups(lookupResult);
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
    void load();
  }, [load]);

  if (loading && !employee) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!employee || !lookups) {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/hr/employees/${employee.id}`)}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        {employee.firstName} {employee.lastName}
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Edit Employee
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the employment record for {employee.employeeCode}.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <EmployeeForm
        mode="edit"
        employee={employee}
        lookups={lookups}
        submitting={submitting}
        mediaBusy={mediaBusy}
        onCancel={() => router.push(`/hr/employees/${employee.id}`)}
        onSubmit={async ({ payload }) => {
          setSubmitting(true);
          setError(null);

          try {
            const updated = await updateEmployee(employee.id, payload);
            router.push(`/hr/employees/${updated.id}`);
          } catch (requestError) {
            setSubmitting(false);
            throw requestError;
          }
        }}
        onUploadPhoto={async (file) => {
          setMediaBusy(true);
          try {
            setEmployee(await uploadEmployeePhoto(employee.id, file));
          } finally {
            setMediaBusy(false);
          }
        }}
        onRemovePhoto={async () => {
          setMediaBusy(true);
          try {
            setEmployee(await removeEmployeePhoto(employee.id));
          } finally {
            setMediaBusy(false);
          }
        }}
        onUploadSignature={async (file) => {
          setMediaBusy(true);
          try {
            setEmployee(await uploadEmployeeSignature(employee.id, file));
          } finally {
            setMediaBusy(false);
          }
        }}
        onRemoveSignature={async () => {
          setMediaBusy(true);
          try {
            setEmployee(await removeEmployeeSignature(employee.id));
          } finally {
            setMediaBusy(false);
          }
        }}
      />
    </div>
  );
}
