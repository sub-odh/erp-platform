"use client";

import { Pencil, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CloudQuotationDeleteView } from "@/components/sajilocloud/cloud-quotation-delete-view";
import { Button, Modal, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  getCloudQuotation,
  getCloudQuotations,
  purgeCloudQuotation,
} from "@/lib/cloud-quotations";
import { formatPiAmount } from "@/lib/pi-format";
import type { CloudQuotationDetails, CloudQuotationListItem } from "@/types/cloud-quotations";

const ROLE_1 = new Set(["OWNER", "SUPER_ADMIN", "ADMIN"]);

export default function CloudQuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleted = searchParams.get("msg") === "deleted";
  const [role, setRole] = useState<string | null>(null);
  const [rows, setRows] = useState<CloudQuotationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CloudQuotationDetails | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CloudQuotationListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getCloudQuotations());
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Quotations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null);
    void load();
  }, [load]);

  async function openView(id: string) {
    const details = await getCloudQuotation(id);
    setView(details);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await purgeCloudQuotation(pendingDelete.id);
      setPendingDelete(null);
      router.push("/sajilocloud/quotations?msg=deleted");
      await load();
    } catch (reason: unknown) {
      setDeleteError(
        reason instanceof ApiError ? reason.message : "The quotation could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <img
          src="/sajilocloud/sajilcloud-logo-small.png"
          alt="SajiloCloud"
          className="h-10 w-auto"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cloud Service Quotations</h1>
          <p className="text-sm text-slate-500">
            Manage customer rates, VPC, VPS, Email, and SOC proposals.
          </p>
        </div>
        <Link href="/sajilocloud/quotations/new">
          <Button>New Quotation</Button>
        </Link>
      </div>
      {deleted ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Quotation deleted successfully.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Quotation #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No quotations created yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => void openView(row.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-blue-700">{row.quotationNumber}</td>
                    <td className="px-4 py-3 font-medium">{row.customerName}</td>
                    <td className="px-4 py-3">{row.quotationDate}</td>
                    <td className="px-4 py-3">{row.expiryDate || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPiAmount(row.totalAmount, row.currency)}
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-center gap-1">
                        <Link href={`/sajilocloud/quotations/${row.id}/edit`} className="rounded p-1 text-slate-600 hover:bg-slate-100" title="Edit">
                          <Pencil className="size-4" />
                        </Link>
                        <Link href={`/sajilocloud/quotations/${row.id}/print`} target="_blank" className="rounded p-1 text-blue-700 hover:bg-blue-50" title="Print PDF">
                          <Printer className="size-4" />
                        </Link>
                        {role && ROLE_1.has(role) ? (
                          <button
                            type="button"
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Delete"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(row);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={Boolean(view)}
        title={view ? `Quotation #${view.quotationNumber}` : "Quotation Details"}
        onClose={() => setView(null)}
        footer={
          <>
            {view ? (
              <Link href={`/sajilocloud/quotations/${view.id}/print`} target="_blank">
                <Button>Print / PDF</Button>
              </Link>
            ) : null}
            <Button variant="secondary" onClick={() => setView(null)}>
              Close
            </Button>
          </>
        }
      >
        {view ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-3 border-b border-slate-200 pb-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Customer Profile</p>
                <p className="font-semibold">{view.customerName}</p>
                <p className="whitespace-pre-line text-slate-500">{view.customerAddress}</p>
              </div>
              <div className="text-right">
                <p><strong>Date:</strong> {view.quotationDate}</p>
                <p><strong>Expiry:</strong> {view.expiryDate || "N/A"}</p>
                <p><strong>Currency:</strong> {view.currency}</p>
              </div>
            </div>
            <table className="w-full border border-slate-200">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-1">Domain</th>
                  <th className="px-2 py-1">Item / Description</th>
                  <th className="px-2 py-1 text-center">Qty</th>
                  <th className="px-2 py-1 text-right">Rate</th>
                  <th className="px-2 py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {view.items.map((item, index) => (
                  <tr key={item.id ?? index} className="border-t border-slate-100">
                    <td className="px-2 py-1 font-semibold">{item.serviceType}</td>
                    <td className="px-2 py-1">
                      {item.itemName}
                      {item.description ? <div className="text-xs text-slate-500">{item.description}</div> : null}
                    </td>
                    <td className="px-2 py-1 text-center">{item.quantity}</td>
                    <td className="px-2 py-1 text-right">{formatPiAmount(item.unitPrice, view.currency)}</td>
                    <td className="px-2 py-1 text-right font-semibold">
                      {formatPiAmount(item.quantity * Number(item.unitPrice), view.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4} className="px-2 py-2 text-right">Grand Total:</th>
                  <th className="px-2 py-2 text-right text-emerald-700">
                    {formatPiAmount(view.totalAmount, view.currency)}
                  </th>
                </tr>
              </tfoot>
            </table>
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <p className="font-semibold">Terms & Conditions:</p>
              <p className="mt-1 whitespace-pre-line font-mono text-[11px] text-slate-500">
                {view.termsConditions || "None"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
      <CloudQuotationDeleteView
        open={Boolean(pendingDelete)}
        quotationNumber={pendingDelete?.quotationNumber ?? ""}
        loading={deleting}
        error={deleteError ?? undefined}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
