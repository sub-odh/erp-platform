"use client";

import { HardDrive, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AssetRegistryModal } from "@/components/inventory/asset-registry-modal";
import { Button, Spinner } from "@/components/ui";
import { archiveInventoryAsset, getInventoryAssets } from "@/lib/inventory";
import {
  inventoryStatusClasses,
  inventoryStatusLabel,
} from "@/lib/inventory-format";
import type { InventoryAsset, InventoryListResponse } from "@/types/inventory";

const PAGE_SIZE = 25;

export default function AssetsPage() {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [meta, setMeta] = useState<InventoryListResponse["pagination"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInventoryAssets({
        page: 1,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "desc",
      });
      setAssets(result.data);
      setMeta(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load assets.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  async function archive(asset: InventoryAsset) {
    if (
      !window.confirm(
        `Delete ${asset.itemName}? This archives the asset and keeps its audit history.`,
      )
    )
      return;
    setDeletingId(asset.id);
    setError(null);
    try {
      await archiveInventoryAsset(asset.id);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete asset.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <HardDrive size={22} className="text-blue-600" /> Asset Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register company equipment, its location, and technical-user
            assignment.
          </p>
        </div>
        <Button
          className="rounded-full px-5 shadow-md"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={17} /> New Asset
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        {loading && assets.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-500">
                  <th className="px-6 py-4">S.No.</th>
                  <th className="px-6 py-4">Asset & Specs</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-36 text-center text-slate-400">
                      No assets have been registered yet.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#16266b]">
                          {asset.itemName}
                        </p>
                        <p className="mt-1 max-w-xl truncate text-xs text-slate-400">
                          {asset.notes ||
                            asset.serialNumber ||
                            asset.modelNumber ||
                            "No technical details added"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${inventoryStatusClasses(asset.status)}`}
                        >
                          {inventoryStatusLabel(asset.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit asset"
                            onClick={() => {
                              setEditing(asset);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete asset"
                            className="text-red-600 hover:bg-red-50"
                            disabled={deletingId === asset.id}
                            onClick={() => void archive(asset)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-sm text-slate-500">{meta?.total ?? 0} assets</p>

      <AssetRegistryModal
        open={modalOpen}
        asset={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}
