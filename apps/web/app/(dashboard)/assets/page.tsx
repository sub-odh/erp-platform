"use client";

import { Pencil, Plus, Server, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AssetRegistryModal } from "@/components/inventory/asset-registry-modal";
import { Button, DeleteConfirmView, Modal, Spinner } from "@/components/ui";
import { officeStatusIsPoc, officeStatusLabel } from "@/lib/asset-office";
import { deleteOfficeAsset, getOfficeAssets } from "@/lib/office-assets";
import type { OfficeAsset } from "@/types/office-asset";

export default function AssetsPage() {
  const [assets, setAssets] = useState<OfficeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OfficeAsset | null>(null);
  const [viewing, setViewing] = useState<OfficeAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OfficeAsset | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssets(await getOfficeAssets());
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

  async function remove(asset: OfficeAsset) {
    setDeletingId(asset.id);
    setError(null);
    try {
      const result = await deleteOfficeAsset(asset.id);
      setNotice(result.message);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete asset.",
      );
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <DeleteConfirmView
        open={pendingDelete !== null}
        title="Delete Asset"
        description="Confirm deletion? Data cannot be recovered."
        confirmLabel="Delete"
        loading={deletingId !== null}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
        onClose={() => {
          if (deletingId) return;
          setPendingDelete(null);
        }}
      />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-[#1b2559]">
            <Server size={18} className="text-blue-600" />
            Asset Inventory
          </h1>
          <p className="mt-0.5 text-xs text-[#a3aed0]">
            Click any row to see full technical details
          </p>
        </div>
        <Button
          className="rounded-full px-5 text-xs font-bold shadow-sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={15} /> New Asset
        </Button>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {loading && assets.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-[#a3aed0]">
                  <th className="px-6 py-3">S.No</th>
                  <th className="px-4 py-3">Asset & Specs</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-xs text-slate-400"
                    >
                      <Server size={28} className="mx-auto mb-2 opacity-25" />
                      No assets registered yet.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-[rgba(67,24,255,0.04)]"
                      onClick={() => setViewing(asset)}
                    >
                      <td className="px-6 py-3 text-xs font-extrabold text-[#a3aed0]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-bold text-[#1b2559]">
                          {asset.assetName}
                        </p>
                        <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-[#a3aed0]">
                          {asset.itemDetails || "No description"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                          {asset.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-3 py-0.5 text-[10px] font-medium text-white"
                          style={{
                            background: officeStatusIsPoc(asset.utilizationStatus)
                              ? "#dc3545"
                              : "#198754",
                          }}
                        >
                          {officeStatusLabel(asset.utilizationStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {asset.techPersonName?.trim() ? (
                          <span className="font-medium text-[#1b2559]">
                            {asset.techPersonName}
                          </span>
                        ) : (
                          <span className="text-[#a3aed0]">—</span>
                        )}
                      </td>
                      <td
                        className="px-6 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Edit"
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#e8ecf4] bg-white text-blue-600 hover:bg-slate-50"
                            onClick={() => {
                              setEditing(asset);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={deletingId === asset.id}
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#e8ecf4] bg-white text-red-600 hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => setPendingDelete(asset)}
                          >
                            <Trash2 size={13} />
                          </button>
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

      <AssetQuickView asset={viewing} onClose={() => setViewing(null)} />

      <AssetRegistryModal
        open={modalOpen}
        asset={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setNotice("Asset saved.");
          void load();
        }}
      />
    </div>
  );
}

function AssetQuickView({
  asset,
  onClose,
}: {
  asset: OfficeAsset | null;
  onClose: () => void;
}) {
  if (!asset) {
    return null;
  }

  const startLabel = [asset.pocStartDate || asset.techUsedDate, asset.pocTakenTime]
    .filter(Boolean)
    .join(" ");

  return (
    <Modal
      open
      title="Quick View"
      onClose={onClose}
      className="max-w-lg"
      footer={
        <Button variant="outline" className="rounded-full px-5" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#4318FF]">
            Asset Specification
          </p>
          <p className="mt-1 text-sm font-bold text-blue-600">{asset.assetName}</p>
          <p className="mt-2 text-xs text-slate-500">
            {asset.itemDetails || "No detailed specifications provided."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#4318FF]">
              Category
            </p>
            <p className="mt-1 text-sm font-bold text-[#1b2559]">
              {asset.category || "N/A"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#4318FF]">
              Location
            </p>
            <p className="mt-1 text-sm font-bold text-[#1b2559]">
              {asset.currentLocation || "N/A"}
            </p>
          </div>
        </div>

        {asset.techPersonName ? (
          <div className="rounded-2xl border border-[#4318FF]/20 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#4318FF]">
              Assigned User
            </p>
            <p className="mt-1 text-sm font-bold text-[#1b2559]">
              {asset.techPersonName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Used since: {asset.techUsedDate || "N/A"}
            </p>
          </div>
        ) : null}

        {officeStatusIsPoc(asset.utilizationStatus) ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-600">
              Active PoC / Loan
            </p>
            <p className="mt-1 text-sm font-bold text-[#1b2559]">
              {asset.pocCompanyName || "N/A"}
            </p>
            <div className="mt-2 flex gap-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#4318FF]">
                  Start
                </p>
                <p className="text-xs font-semibold text-[#1b2559]">
                  {startLabel || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-600">
                  Deadline
                </p>
                <p className="text-xs font-semibold text-red-600">
                  {asset.returnDeadline || "N/A"}
                  {asset.returnTime ? ` ${asset.returnTime}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
