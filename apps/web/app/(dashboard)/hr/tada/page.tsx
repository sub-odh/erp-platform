"use client";

import { Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Modal, Spinner, Textarea } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import {
  approveTadaExpense,
  getTadaExpenses,
  rejectTadaExpense,
} from "@/lib/tada";
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

export default function TadaManagementPage() {
  const [expenses, setExpenses] = useState<TadaExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TadaExpense | null>(null);
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setExpenses(await getTadaExpenses());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load TADA requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openDetails(expense: TadaExpense) {
    setSelected(expense);
    setRemarks(expense.remarks ?? "");
  }

  async function review(
    action: "approve" | "reject",
    expense: TadaExpense,
    nextRemarks = remarks,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      const payload = { remarks: nextRemarks.trim() || null };
      const updated =
        action === "approve"
          ? await approveTadaExpense(expense.id, payload)
          : await rejectTadaExpense(expense.id, payload);
      setSelected(null);
      setExpenses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this TADA request.",
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
          <p className="text-sm font-medium text-blue-600">HR & Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            TADA Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Review travel allowance requests and approve or reject pending claims.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading && expenses.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Description / Route</th>
                  <th className="px-5 py-3 text-right">Amount (Rs.)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Approve / Reject</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-32 text-center text-slate-400">
                      No TADA requests have been submitted yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                      onClick={() => openDetails(expense)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {expense.employeeName}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {expense.purpose || "Travel claim"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {routeLabel(expense)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT[expense.status]}>
                          {STATUS_LABEL[expense.status]}
                        </Badge>
                      </td>
                      <td
                        className="px-5 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {expense.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={submitting}
                              onClick={() =>
                                void review("approve", expense, "")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={submitting}
                              onClick={() => void review("reject", expense, "")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        title="TADA Request"
        description={selected ? selected.employeeName : undefined}
        onClose={() => setSelected(null)}
        footer={
          selected?.status === "PENDING" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
                disabled={submitting}
              >
                Close
              </Button>
              <Button
                variant="danger"
                loading={submitting}
                onClick={() => selected && void review("reject", selected)}
              >
                Reject
              </Button>
              <Button
                variant="success"
                loading={submitting}
                onClick={() => selected && void review("approve", selected)}
              >
                Approve
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          )
        }
      >
        {selected ? (
          <div className="space-y-4">
            <DetailRow label="Travel Date" value={formatDate(selected.travelDate)} />
            <DetailRow label="Route" value={routeLabel(selected)} />
            <DetailRow label="Amount" value={formatCurrency(selected.amount)} />
            <DetailRow
              label="Purpose"
              value={selected.purpose || "No purpose provided."}
            />
            <DetailRow
              label="Status"
              value={STATUS_LABEL[selected.status]}
            />
            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              disabled={selected.status !== "PENDING" || submitting}
              placeholder="Add optional review remarks"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function routeLabel(expense: TadaExpense) {
  if (expense.origin && expense.destination) {
    return `${expense.origin} → ${expense.destination}`;
  }

  return expense.origin || expense.destination || "No route provided.";
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
