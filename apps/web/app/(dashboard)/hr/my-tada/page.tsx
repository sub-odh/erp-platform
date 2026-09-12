"use client";

import { Wallet } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge, Button, Input, Spinner, Textarea } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { toIsoDate } from "@/lib/nepali-date";
import { createTadaExpense, getMyTadaExpenses } from "@/lib/tada";
import type { ExpenseStatus, TadaExpense } from "@/types/expense";

const STATUS_VARIANT: Record<
  ExpenseStatus,
  "warning" | "success" | "danger"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const emptyForm = {
  travelDate: toIsoDate(new Date()),
  origin: "",
  destination: "",
  amount: "",
  purpose: "",
};

export default function MyTadaPage() {
  const [records, setRecords] = useState<TadaExpense[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setRecords(await getMyTadaExpenses());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your TADA requests.",
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
      await createTadaExpense({
        travelDate: form.travelDate,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        amount: Number(form.amount),
        purpose: form.purpose.trim() || null,
      });
      setForm({ ...emptyForm, travelDate: toIsoDate(new Date()) });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit this TADA request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Wallet size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            My TA/DA Request
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Submit a travel allowance claim and track the status of your requests.
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
        <h2 className="text-lg font-semibold text-slate-900">New Request</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Travel Date"
            type="date"
            required
            value={form.travelDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                travelDate: event.target.value,
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
            label="Origin"
            required
            value={form.origin}
            onChange={(event) =>
              setForm((current) => ({ ...current, origin: event.target.value }))
            }
          />
          <Input
            label="Destination"
            required
            value={form.destination}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                destination: event.target.value,
              }))
            }
          />
        </div>
        <Textarea
          label="Purpose"
          value={form.purpose}
          onChange={(event) =>
            setForm((current) => ({ ...current, purpose: event.target.value }))
          }
          placeholder="Describe the travel purpose"
        />
        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Submit Request
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
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Travel Date</th>
                  <th className="px-5 py-3">Description / Route</th>
                  <th className="px-5 py-3 text-right">Amount (Rs.)</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center text-slate-400">
                      You have not submitted any TADA requests yet.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(record.travelDate)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {record.purpose || "Travel claim"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record.origin} → {record.destination}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {formatCurrency(record.amount)}
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
