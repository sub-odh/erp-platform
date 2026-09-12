"use client";

import { Fuel } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge, Button, Input, Spinner, Textarea } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { createFuelRecord, getMyFuelRecords } from "@/lib/fuel";
import { toIsoDate } from "@/lib/nepali-date";
import type { FuelRecord, FuelStatus } from "@/types/fuel";

const STATUS_VARIANT: Record<
  FuelStatus,
  "warning" | "success" | "danger" | "purple" | "primary"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  FLAGGED: "purple",
  REIMBURSED: "primary",
};

const STATUS_LABEL: Record<FuelStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
  REIMBURSED: "Reimbursed",
};

const emptyForm = {
  vehicleNo: "",
  fuelDate: toIsoDate(new Date()),
  amount: "",
  liters: "",
  purpose: "",
};

export default function MyFuelPage() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setRecords(await getMyFuelRecords());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your fuel records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createFuelRecord({
        vehicleNo: form.vehicleNo.trim(),
        fuelDate: form.fuelDate,
        amount: Number(form.amount),
        liters: Number(form.liters),
        purpose: form.purpose.trim() || null,
      });
      setForm({ ...emptyForm, fuelDate: toIsoDate(new Date()) });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit this fuel record.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Fuel size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            My Fuel Records
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Log a fuel purchase and track reimbursement for your vehicle claims.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">New Record</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Vehicle No"
            required
            value={form.vehicleNo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                vehicleNo: event.target.value,
              }))
            }
          />
          <Input
            label="Fuel Date"
            type="date"
            required
            value={form.fuelDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fuelDate: event.target.value,
              }))
            }
          />
          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <Input
            label="Liters"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={form.liters}
            onChange={(event) =>
              setForm((current) => ({ ...current, liters: event.target.value }))
            }
          />
        </div>
        <Textarea
          label="Purpose"
          value={form.purpose}
          onChange={(event) =>
            setForm((current) => ({ ...current, purpose: event.target.value }))
          }
          placeholder="Describe the trip or vehicle use"
        />
        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Submit Record
          </Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading && records.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Vehicle No</th>
                  <th className="px-5 py-3">Fuel Date</th>
                  <th className="px-5 py-3 text-right">Volume (L)</th>
                  <th className="px-5 py-3 text-right">Cost (Rs.)</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-slate-400">
                      You have not submitted any fuel records yet.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {record.vehicleNo}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(record.fuelDate)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {record.liters.toLocaleString("en-NP", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {record.purpose || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT[record.status]}>
                          {STATUS_LABEL[record.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
