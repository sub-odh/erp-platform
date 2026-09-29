"use client";

import { Calendar, RotateCcw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import {
  Button,
  Input,
  ReplacementConfirmView,
  Select,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { lookupReturnItems, processItemReturns } from "@/lib/item-returns";
import type { ReturnLookupItem } from "@/types/item-returns";

type ReturnAction = "standard" | "damaged";

function formatDoDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString(
    "en-US",
    { month: "short", day: "2-digit", year: "numeric" },
  );
}

function statusChipClass(label: string): string {
  if (label === "Returned" || label === "Available") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (label === "Delivered" || label === "Sold") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  if (label === "Damaged" || label === "Out of Stock") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default function ItemReturnsPage() {
  const router = useRouter();
  const [doNumber, setDoNumber] = useState("");
  const [serial, setSerial] = useState("");
  const [items, setItems] = useState<ReturnLookupItem[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<ReturnAction>("standard");
  const [remarks, setRemarks] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchIsError, setSearchIsError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const chosen = useMemo(
    () =>
      (items ?? []).filter(
        (item) => selected.includes(item.lineId) && !item.processed,
      ),
    [items, selected],
  );

  async function search(event: FormEvent) {
    event.preventDefault();
    const delivery = doNumber.trim();
    const serialNumber = serial.trim();
    setActionError(null);
    if (!delivery && !serialNumber) {
      setItems(null);
      setSelected([]);
      setSearchIsError(false);
      setSearchMessage("Enter a DO number or a serial number.");
      return;
    }
    setSearching(true);
    setSearchMessage(null);
    setSelected([]);
    try {
      const rows = await lookupReturnItems({
        doNumber: delivery,
        serial: serialNumber,
      });
      setItems(rows);
      setSearchIsError(false);
      setSearchMessage(
        rows.length ? null : "No records found matching your input.",
      );
    } catch (requestError) {
      setItems(null);
      setSearchIsError(true);
      setSearchMessage(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to search delivery items.",
      );
    } finally {
      setSearching(false);
    }
  }

  function toggle(lineId: string) {
    setActionError(null);
    setSelected((current) =>
      current.includes(lineId)
        ? current.filter((value) => value !== lineId)
        : [...current, lineId],
    );
  }

  async function process(returnType: ReturnAction) {
    const lineIds = chosen.map((item) => item.lineId);
    if (!lineIds.length) {
      setActionError("Select at least one item.");
      setConfirmOpen(false);
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const result = await processItemReturns({
        lineIds,
        returnType,
        remarks: remarks.trim() || undefined,
      });
      if (returnType === "damaged") {
        const clientName = chosen[0]?.customerName ?? "";
        const params = new URLSearchParams({
          billable: "0",
          replaceItemIds: [...new Set(chosen.map((item) => item.id))].join(
            ",",
          ),
        });
        if (clientName) params.set("clientName", clientName);
        router.push(`/delivery-orders/new?${params.toString()}`);
        return;
      }
      router.push(
        `/inventory/master?notice=${encodeURIComponent(result.message)}`,
      );
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Processing failed.",
      );
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-[#1b2559]">
          <RotateCcw size={18} className="text-blue-600" />
          Device Return & Replacement
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Find a delivered item, then return it to stock or mark it damaged.
        </p>
      </div>

      <section className="mx-auto w-full max-w-3xl rounded-[20px] bg-white px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:px-8 sm:py-8">
        <h2 className="text-lg font-bold text-[#1b2559]">Asset Verification</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search with a DO number, a serial number, or both.
        </p>

        <form className="mt-5" onSubmit={(event) => void search(event)}>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input
              label="DO Number"
              name="do_no"
              placeholder="DO-..."
              value={doNumber}
              onChange={(event) => setDoNumber(event.target.value)}
            />
            <Input
              label="Serial Number"
              name="serial"
              placeholder="SN..."
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
            />
            <Button
              type="submit"
              loading={searching}
              className="w-full rounded-xl bg-[#1b2559] hover:bg-[#16266b] sm:w-auto sm:px-6"
            >
              Search Items
            </Button>
          </div>
        </form>

        {searchMessage ? (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-center text-sm ${
              searchIsError
                ? "bg-red-50 text-red-700"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {searchMessage}
          </div>
        ) : null}

        {items?.length ? (
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              void process("standard");
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#1b2559]">
                Select Items to Process
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {chosen.length} selected
              </p>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const isSelected = chosen.some(
                  (row) => row.lineId === item.lineId,
                );
                return (
                  <label
                    key={item.lineId}
                    className={`block rounded-xl border p-4 ${
                      item.processed
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                        : isSelected
                          ? "cursor-pointer border-[#4318ff] bg-[#f4f7fe] ring-1 ring-[#4318ff]"
                          : "cursor-pointer border-slate-200 bg-[#f4f7fe] hover:border-[#4318ff]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0 accent-[#4318ff]"
                        checked={isSelected}
                        disabled={item.processed || saving}
                        onChange={() => toggle(item.lineId)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-bold text-slate-900">
                            {item.itemName}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusChipClass(item.statusLabel)}`}
                          >
                            {item.statusLabel}
                          </span>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          <User size={12} />
                          {item.customerName || "Unknown"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          SN:{" "}
                          <span className="font-semibold text-slate-700">
                            {item.serialNumber || "—"}
                          </span>
                          <span className="px-1.5 text-slate-300">|</span>
                          DO:{" "}
                          <span className="font-semibold text-slate-700">
                            {item.deliveryNumber}
                          </span>
                          <span className="px-1.5 text-slate-300">|</span>
                          Qty:{" "}
                          <span className="font-semibold text-slate-700">
                            {item.quantity}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                            <Calendar size={13} />
                            {formatDoDate(item.deliveryDate)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.expired
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.expired ? "Policy Expired" : "Eligible"} ·{" "}
                            {item.daysOld} days old
                          </span>
                          {item.processed ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Already processed
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <Select
                label="Action Type"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value as ReturnAction);
                  setActionError(null);
                }}
              >
                <option value="standard">
                  Standard Return (Back to Stock)
                </option>
                <option value="damaged">Damaged / RMA Replacement</option>
              </Select>

              {action === "standard" ? (
                <div className="space-y-4">
                  <Textarea
                    label="Remarks"
                    rows={2}
                    placeholder="Reason for return..."
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    style={{ minHeight: "4.5rem" }}
                  />
                  {actionError ? (
                    <p className="text-sm text-red-600">{actionError}</p>
                  ) : null}
                  <Button
                    type="submit"
                    loading={saving}
                    disabled={!chosen.length}
                    className="w-full rounded-xl bg-[#4318ff] hover:bg-[#3311db]"
                  >
                    Confirm Process
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-sm font-bold text-red-700">
                    Replacement Workflow
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Selected devices are marked damaged, then a new
                    non-billable delivery order opens for the replacement.
                  </p>
                  {actionError ? (
                    <p className="mt-3 text-sm text-red-700">{actionError}</p>
                  ) : null}
                  <Button
                    type="button"
                    variant="danger"
                    className="mt-4 w-full rounded-full"
                    disabled={!chosen.length}
                    onClick={() => {
                      if (!chosen.length) {
                        setActionError("Select at least one item.");
                        return;
                      }
                      setActionError(null);
                      setConfirmOpen(true);
                    }}
                  >
                    Mark as Damaged & Create DO
                  </Button>
                </div>
              )}
            </div>
          </form>
        ) : null}
      </section>

      <ReplacementConfirmView
        open={confirmOpen}
        loading={saving}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
        onConfirm={() => void process("damaged")}
      />
    </div>
  );
}
