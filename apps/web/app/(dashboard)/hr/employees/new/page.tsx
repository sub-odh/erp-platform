"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmployeeForm } from "@/components/employees/employee-form";
import { Button, Spinner } from "@/components/ui";
import {
  createEmployee,
  getEmployeeLookups,
  uploadEmployeePhoto,
  uploadEmployeeSignature,
} from "@/lib/employees";
import type { EmployeeLookups } from "@/types/employee";

export default function NewEmployeePage() {
  const router = useRouter();
  const [lookups, setLookups] = useState<EmployeeLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getEmployeeLookups()
      .then((result) => {
        if (!cancelled) {
          setLookups(result);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load employee lookups.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/hr/employees")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Employee Management
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Add Employee
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a company-scoped employment record. Linking a user is optional
          and does not create a login password here.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {lookups ? (
        <EmployeeForm
          mode="create"
          lookups={lookups}
          submitting={submitting}
          onCancel={() => router.push("/hr/employees")}
          onSubmit={async ({ payload, photoFile, signatureFile }) => {
            setSubmitting(true);
            setError(null);

            try {
              const created = await createEmployee(payload);

              try {
                if (photoFile) {
                  await uploadEmployeePhoto(created.id, photoFile);
                }

                if (signatureFile) {
                  await uploadEmployeeSignature(created.id, signatureFile);
                }
              } catch {
                /* The record exists; photo and signature can be added from Edit. */
              }

              router.push(`/hr/employees/${created.id}`);
            } catch (requestError) {
              setSubmitting(false);
              throw requestError;
            }
          }}
        />
      ) : (
        <Button variant="outline" onClick={() => router.push("/hr/employees")}>
          Back to Employees
        </Button>
      )}
    </div>
  );
}
