"use client";

import {
  BadgeDollarSign,
  Boxes,
  CircleDollarSign,
  Layers3,
  PackagePlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { InventoryAssetModal } from "@/components/inventory/inventory-asset-modal";
import { Button, Spinner } from "@/components/ui";
import { formatRupees } from "@/lib/inventory-format";
import { getInventoryDashboard } from "@/lib/inventory";
import type { InventoryDashboard } from "@/types/inventory";

export default function InventoryDashboardPage() {
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await getInventoryDashboard());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load inventory dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const cards = dashboard
    ? [
        {
          label: "Total",
          value: String(dashboard.total),
          icon: Boxes,
          tone: "slate",
          href: "/inventory/master",
        },
        {
          label: "Stock",
          value: String(dashboard.stock),
          icon: Layers3,
          tone: "blue",
          href: "/inventory/master?group=stock",
        },
        {
          label: "Sold",
          value: String(dashboard.sold),
          icon: BadgeDollarSign,
          tone: "emerald",
          href: "/inventory/master?group=sold",
        },
        {
          label: "Investment",
          value: formatRupees(dashboard.investment),
          icon: CircleDollarSign,
          tone: "cyan",
          href: undefined,
        },
        {
          label: "Market Value",
          value: formatRupees(dashboard.marketValue),
          icon: CircleDollarSign,
          tone: "strong",
          href: undefined,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-[#16266b]">
            Inventory Intelligence
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#a3aed0]">
            Managing {dashboard?.total ?? 0} Assets
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-full px-6 shadow-lg shadow-blue-200"
            onClick={() => setRegisterOpen(true)}
          >
            <PackagePlus size={17} /> Register Asset
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !dashboard ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : dashboard ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              const strong = card.tone === "strong";
              const iconTone =
                card.tone === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : card.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-600"
                    : card.tone === "cyan"
                      ? "bg-cyan-50 text-cyan-500"
                      : strong
                        ? "bg-white text-blue-600"
                        : "bg-slate-100 text-slate-500";
              const body = (
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconTone}`}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold uppercase ${strong ? "text-blue-200" : "text-[#16266b]"}`}
                    >
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                  </div>
                </div>
              );
              const className = `rounded-2xl border p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 ${strong ? "border-blue-600 bg-blue-600 text-white" : "border-white bg-white text-[#16266b]"}`;
              return card.href ? (
                <Link key={card.label} href={card.href} className={className}>
                  {body}
                </Link>
              ) : (
                <article key={card.label} className={className}>
                  {body}
                </article>
              );
            })}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide text-[#9aa7d3]">
                Vendor Breakdown
              </h2>
              {dashboard.damaged > 0 ? (
                <span className="text-xs text-red-500">
                  {dashboard.damaged} damaged
                </span>
              ) : null}
            </div>
            {dashboard.vendors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
                Register your first asset to see inventory intelligence.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {dashboard.vendors.map((vendor) => {
                  const vendorQuery = `vendor=${encodeURIComponent(vendor.vendor)}`;
                  return (
                    <article
                      key={vendor.vendor}
                      className="rounded-2xl bg-white p-5 shadow-[0_18px_42px_rgba(30,58,138,0.10)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#27398a] font-semibold text-white">
                          {vendor.vendor.charAt(0).toUpperCase()}
                        </div>
                        <p className="truncate font-semibold text-[#16266b]">
                          {vendor.vendor}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 px-2 py-3 text-center">
                        <Link
                          href={`/inventory/master?${vendorQuery}&group=stock`}
                          className="hover:opacity-70"
                        >
                          <p className="text-[10px] uppercase text-blue-500">
                            Stock
                          </p>
                          <p className="font-semibold text-blue-600">
                            {vendor.stock}
                          </p>
                        </Link>
                        <Link
                          href={`/inventory/master?${vendorQuery}&group=sold`}
                          className="hover:opacity-70"
                        >
                          <p className="text-[10px] uppercase text-blue-500">
                            Sold
                          </p>
                          <p className="font-semibold text-emerald-600">
                            {vendor.sold}
                          </p>
                        </Link>
                        <Link
                          href={`/inventory/master?${vendorQuery}&group=damaged`}
                          className="hover:opacity-70"
                        >
                          <p className="text-[10px] uppercase text-blue-500">
                            Dmg
                          </p>
                          <p className="font-semibold text-red-600">
                            {vendor.damaged}
                          </p>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}

      <InventoryAssetModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}
