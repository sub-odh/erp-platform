"use client";

import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { getCustomerHistory } from "@/lib/customers";
import type { CustomerHistoryResponse } from "@/types/customer";

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientHistoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params.id;
  const [history, setHistory] = useState<CustomerHistoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setHistory(await getCustomerHistory(customerId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load client history.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(() => {
    if (!history) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (!query) {
      return history.orders;
    }

    return history.orders.filter((order) =>
      [order.deliveryNumber, order.status, order.invoiceNumber ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [history, search]);

  if (loading && !history) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push("/hr/clients")}>
          <ArrowLeft size={16} /> Directory
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error ?? "Client not found."}
        </div>
      </div>
    );
  }

  const { customer } = history;

  return (
    <div className="space-y-5">
      <Button
        variant="outline"
        className="rounded-lg"
        onClick={() => router.push("/hr/clients")}
      >
        <ArrowLeft size={16} /> Directory
      </Button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="border-slate-200 lg:col-span-4 lg:border-r lg:pr-6">
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <span className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              PAN: {customer.taxNumber ?? "N/A"}
            </span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Address
            </p>
            <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-800">
              {customer.address ??
                customer.billingAddressLine1 ??
                "No address provided"}
            </p>
          </div>
          <div className="border-slate-200 lg:col-span-5 lg:border-r lg:px-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Contact Person
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-600">
                  {customer.contactPerson ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Phone
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {customer.phone ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Email Address
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {customer.email ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:col-span-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Orders
              </span>
              <span className="font-bold text-slate-900">
                {history.totalOrders}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50 px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-rose-400">
                Due
              </span>
              <span className="font-bold text-rose-600">
                {formatCurrency(history.totalDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <History size={16} className="text-blue-600" />
            Delivery Log
          </h2>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders..."
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white sm:w-52"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">DO Number</th>
                <th className="px-4 py-3">Delivery Date</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Balance Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No transactions found for this client.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const due = Number(order.balanceDue);
                  const paid = order.status === "Paid";
                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {order.deliveryNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td
                        className={`px-4 py-3 font-semibold ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {formatCurrency(order.balanceDue)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${
                            paid
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-amber-100 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {order.invoiceId ? (
                          <Link
                            href={`/invoices/${order.invoiceId}`}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </Link>
                        ) : (
                          <Link
                            href="/delivery-orders"
                            className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
