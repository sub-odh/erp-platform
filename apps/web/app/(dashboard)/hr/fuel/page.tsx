"use client";

import { Fuel } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Input, Modal, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import {
  approveFuelRecord,
  getFuelRecords,
  rejectFuelRecord,
  reimburseFuelRecord,
  updateFuelSettings,
} from "@/lib/fuel";
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

export default function FuelManagementPage() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [threshold, setThreshold] = useState(250);
  const [limitInput, setLimitInput] = useState("250");
  const [totals, setTotals] = useState({ liters: 0, amount: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<FuelRecord | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getFuelRecords();
      setRecords(result.records);
      setTotals(result.totals);
      setThreshold(result.threshold);
      setLimitInput(String(result.threshold));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load fuel records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpdateLimit() {
    const next = Number(limitInput);

    if (!Number.isFinite(next) || next < 0) {
      setError("Enter a valid fuel limit.");
      return;
    }

    setSavingLimit(true);
    setError(null);

    try {
      const saved = await updateFuelSettings({ threshold: next });
      setThreshold(saved.threshold);
      setLimitInput(String(saved.threshold));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the fuel limit.",
      );
    } finally {
      setSavingLimit(false);
    }
  }

  async function review(action: "approve" | "reject", record: FuelRecord) {
    setSubmitting(true);
    setError(null);

    try {
      const updated =
        action === "approve"
          ? await approveFuelRecord(record.id)
          : await rejectFuelRecord(record.id);
      setRecords((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this fuel record.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid() {
    if (!paying) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await reimburseFuelRecord(paying.id, {
        paymentReference: paymentReference.trim(),
      });
      setRecords((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setPaying(null);
      setPaymentReference("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to mark this record as paid.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Fuel size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Fuel Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Review fuel claims, flag high unit costs, and mark approved records
              as paid.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Limit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={limitInput}
            onChange={(event) => setLimitInput(event.target.value)}
          />
          <Button
            variant="outline"
            loading={savingLimit}
            onClick={() => void handleUpdateLimit()}
          >
            Update Limit
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading && records.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Volume (L)</th>
                  <th className="px-5 py-3 text-right">Cost (Rs.)</th>
                  <th className="px-5 py-3 text-right">Efficiency (Rs. per Liter)</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-slate-400">
                      No fuel records have been submitted yet.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const overLimit = record.pricePerLiter > threshold;

                    return (
                      <tr key={record.id} className="border-b border-slate-100">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">
                            {record.employeeName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {record.vehicleNo}
                          </p>
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
                        <td
                          className={cn(
                            "px-5 py-3 text-right font-semibold",
                            overLimit ? "text-red-600" : "text-slate-900",
                          )}
                        >
                          {formatCurrency(record.pricePerLiter)}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {record.purpose || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[record.status]}>
                            {STATUS_LABEL[record.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {record.status === "PENDING" ||
                          record.status === "FLAGGED" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                disabled={submitting}
                                onClick={() => void review("approve", record)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={submitting}
                                onClick={() => void review("reject", record)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : record.status === "APPROVED" ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setPaying(record);
                                setPaymentReference("");
                              }}
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {record.paymentReference || "Closed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 text-sm font-semibold text-slate-800">
                  <td className="px-5 py-3" colSpan={2}>
                    Totals
                  </td>
                  <td className="px-5 py-3 text-right">
                    {totals.liters.toLocaleString("en-NP", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatCurrency(totals.amount)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(paying)}
        title="Mark Paid"
        description={
          paying
            ? `${paying.employeeName} · ${formatCurrency(paying.amount)}`
            : undefined
        }
        onClose={() => setPaying(null)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPaying(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              loading={submitting}
              disabled={!paymentReference.trim()}
              onClick={() => void handleMarkPaid()}
            >
              Mark Paid
            </Button>
          </>
        }
      >
        <Input
          label="Payment Reference"
          required
          value={paymentReference}
          onChange={(event) => setPaymentReference(event.target.value)}
          placeholder="Cheque, transfer, or voucher number"
        />
      </Modal>
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
