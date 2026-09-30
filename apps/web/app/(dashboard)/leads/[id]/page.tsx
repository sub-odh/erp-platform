"use client";

import { Check, Pencil, Star, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Input, Modal, Select, Spinner, Textarea } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatPiAmount } from "@/lib/pi-format";
import {
  getDeal,
  PIPELINE_STAGES,
  postPipelineActivity,
  setFinalQuotation,
  stageMeta,
  updatePipelineProfile,
  updatePipelineSettings,
  updatePipelineSource,
  type DealDetails,
} from "@/lib/pipeline";

const SOURCES = ["Website", "Referral", "Cold Call", "Social Media", "Email Campaign", "Exhibition/Event", "Partner", "Direct", "Other"];

export default function DealDetailsPage() {
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<DealDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"activity" | "settings">("activity");
  const [remarks, setRemarks] = useState("");
  const [editingSource, setEditingSource] = useState(false);
  const [source, setSource] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ stage: "Discovery", winningProbability: 0, dealValue: "0", expectedClosing: "" });
  const [progress, setProgress] = useState(0);

  async function load() {
    const details = await getDeal(params.id);
    setDeal(details);
    setSource(details.source);
    setSettings({
      stage: details.stage,
      winningProbability: details.winningProbability,
      dealValue: details.dealValue,
      expectedClosing: details.expectedClosing ?? "",
    });
  }

  useEffect(() => {
    let active = true;
    getDeal(params.id)
      .then((details) => {
        if (!active) return;
        setDeal(details);
        setSource(details.source);
        setSettings({
          stage: details.stage,
          winningProbability: details.winningProbability,
          dealValue: details.dealValue,
          expectedClosing: details.expectedClosing ?? "",
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Lead record not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!deal) return;
    setProgress(0);
    const frame = requestAnimationFrame(() => setProgress(stageMeta(deal.stage).percent));
    return () => cancelAnimationFrame(frame);
  }, [deal]);

  if (error) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!deal) return <div className="flex justify-center py-16"><Spinner /></div>;

  const meta = stageMeta(deal.stage);
  const title = deal.projectTitle || deal.companyName;
  const events = buildTimeline(deal);
  const latestQuote = deal.quotations[0];
  const sourceOptions = SOURCES.includes(deal.source) || !deal.source ? SOURCES : [deal.source, ...SOURCES];

  async function saveActivity() {
    if (!remarks.trim()) return;
    setSaving(true);
    try {
      await postPipelineActivity(deal!.id, remarks.trim());
      setRemarks("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/leads" className="text-xs text-slate-500">Back to Sales Tracker</Link>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-400">Company: {deal.companyName} | Lead ID: #{deal.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deal.canUpdate ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit Lead</Button>
          ) : null}
          {latestQuote ? (
            <Link href={`/quotations/${latestQuote.id}/print`} target="_blank">
              <Button variant="outline" size="sm">View Quotation (#{latestQuote.quotationNumber})</Button>
            </Link>
          ) : null}
          <Link href={`/quotations/new?leadId=${deal.id}&customerName=${encodeURIComponent(deal.companyName)}`}>
            <Button size="sm">Generate Quotation</Button>
          </Link>
          <span className="rounded px-3 py-1 text-sm text-white" style={{ backgroundColor: meta.hex }}>{deal.stage}</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid text-center md:grid-cols-4">
          <Stat label="Deal Value" value={formatPiAmount(deal.dealValue, "NPR")} />
          <Stat label="Stage" value={deal.stage} />
          <Stat label="Win Probability" value={`${deal.winningProbability}%`} />
          <Stat label="Expected Closing" value={formatClosing(deal.expectedClosing)} />
        </div>
        <div className="h-2.5 bg-slate-200">
          <div className="h-full transition-[width] duration-1000" style={{ width: `${progress}%`, backgroundColor: meta.hex }} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-700 text-xl font-bold text-white">
                {(deal.companyName || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{deal.companyName}</p>
                <p className="text-sm text-slate-500">{deal.source || "Lead"}</p>
              </div>
            </div>
            <Field label="Project / Requirement" value={deal.projectTitle || "N/A"} />
            <Field label="Contact Person" value={deal.contactPerson || "N/A"} />
            <Field label="Contact Details" value={`${deal.phone || "N/A"}\n${deal.email || "N/A"}`} />
            <Field label="Assigned To" value={deal.assignedName} />
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase">7-Stage Guidelines</h2>
            <p className="my-2 text-xs text-slate-500">
              Activity dots match the deal stage at the time of each update. Select a stage when posting activities or updating settings.
            </p>
            <div className="space-y-1 text-xs">
              {PIPELINE_STAGES.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.hex }} />
                  <span className="flex-1 font-medium">{item.name}</span>
                  <span className="text-slate-500">{item.percent}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div>
          <div className="mb-3 flex gap-2">
            <button type="button" className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "activity" ? "bg-indigo-700 text-white" : "text-slate-500"}`} onClick={() => setTab("activity")}>Activity History</button>
            <button type="button" className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "settings" ? "bg-indigo-700 text-white" : "text-slate-500"}`} onClick={() => setTab("settings")}>Update Settings</button>
          </div>
          {tab === "activity" ? (
            <div className="space-y-4">
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="space-y-3 border-l-2 border-slate-200 pl-4">
                  {events.map((event, index) => (
                    <div key={index} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white" style={{ backgroundColor: event.color }} />
                      <div className="rounded-xl border border-slate-100 p-3 text-sm">
                        <p className="text-[11px] font-semibold text-slate-500">{event.when}</p>
                        <p>{event.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white bg-slate-400" />
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                      Lead created on {formatCreated(deal.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {editingSource ? (
                    <div className="flex gap-2">
                      <Select value={source} onChange={(event) => setSource(event.target.value)}>
                        {sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                      <Button size="sm" variant="success" onClick={() => void updatePipelineSource(deal.id, source).then(load).then(() => setEditingSource(false))}><Check className="size-4" /></Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingSource(false)}><X className="size-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <Input label="Lead Source" value={deal.source || "N/A"} readOnly />
                      {deal.canUpdate ? <Button size="sm" variant="secondary" onClick={() => setEditingSource(true)}><Pencil className="size-4" /></Button> : null}
                    </div>
                  )}
                  <Textarea label="Activity Log / Remarks" value={remarks} placeholder="Enter ongoing activity updates..." onChange={(event) => setRemarks(event.target.value)} />
                  <Button size="sm" loading={saving} onClick={() => void saveActivity()}>Post Activity</Button>
                </div>
              </section>
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold">Mapped Documents</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Quotations ({deal.quotations.length})</p>
                    {deal.quotations.length === 0 ? <p className="text-center text-sm italic text-slate-500">No quotations linked yet.</p> : deal.quotations.map((quote) => (
                      <div key={quote.id} className="mb-2 flex items-center justify-between rounded-lg bg-white p-2">
                        <div>
                          <p className="text-sm font-semibold">{quote.quotationNumber} {quote.isFinal ? <span className="ml-1 rounded bg-emerald-600 px-1 text-[9px] text-white">Final</span> : <span className="ml-1 rounded bg-slate-500 px-1 text-[9px] text-white">Draft</span>}</p>
                          <p className="text-[11px] text-slate-500">{formatPiAmount(quote.totalAmount, quote.currency)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {deal.canUpdate ? (
                            <button type="button" disabled={quote.isFinal === 1} title={quote.isFinal ? "Current Final Quotation" : "Mark as Final Quotation"} className="rounded-full border p-1" onClick={() => void setFinalQuotation(deal.id, quote.id).then(load)}>
                              <Star className={`size-3 ${quote.isFinal ? "fill-emerald-600 text-emerald-600" : ""}`} />
                            </button>
                          ) : null}
                          <Link href={`/quotations/${quote.id}/print`} target="_blank" className="text-xs text-blue-700">View</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Delivery Orders ({deal.deliveryOrders.length})</p>
                    {deal.deliveryOrders.length === 0 ? <p className="text-center text-sm italic text-slate-500">No delivery orders linked yet.</p> : deal.deliveryOrders.map((order) => (
                      <div key={order.id} className="mb-2 flex items-center justify-between rounded-lg bg-white p-2">
                        <div>
                          <p className="text-sm font-semibold">{order.deliveryNumber}</p>
                          <p className="text-[11px] text-slate-500">{order.deliveryDate}{order.invoiceNumber ? ` | Inv: ${order.invoiceNumber}` : ""}</p>
                        </div>
                        {order.invoiceId ? <Link href={`/invoices/${order.invoiceId}`} className="text-xs text-emerald-700">View Invoice</Link> : <span className="text-[10px] text-slate-400">No Invoice</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <form className="space-y-3" onSubmit={(event) => {
                event.preventDefault();
                void updatePipelineSettings(deal.id, {
                  stage: settings.stage,
                  winningProbability: Number(settings.winningProbability),
                  dealValue: Number(settings.dealValue),
                  expectedClosing: settings.expectedClosing || undefined,
                }).then(load);
              }}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="Stage" value={settings.stage} onChange={(event) => setSettings({ ...settings, stage: event.target.value })}>
                    {PIPELINE_STAGES.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.percent}%)</option>)}
                  </Select>
                  <Input label="Probability (%)" type="number" value={settings.winningProbability} onChange={(event) => setSettings({ ...settings, winningProbability: Number(event.target.value) })} />
                  <Input label="Value (Rs.)" type="number" step="0.01" value={settings.dealValue} onChange={(event) => setSettings({ ...settings, dealValue: event.target.value })} />
                  <Input label="Closing Date" type="date" value={settings.expectedClosing} onChange={(event) => setSettings({ ...settings, expectedClosing: event.target.value })} />
                </div>
                <Button type="submit">Save Settings</Button>
              </form>
            </section>
          )}
        </div>
      </div>
      <EditLeadModal
        key={`${deal.companyName}|${deal.projectTitle}|${deal.contactPerson}|${deal.phone}|${deal.email}|${deal.assignedEmployeeId ?? ""}`}
        open={editOpen}
        deal={deal}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); void load(); }}
      />
    </div>
  );
}

function EditLeadModal({ open, deal, onClose, onSaved }: { open: boolean; deal: DealDetails; onClose: () => void; onSaved: () => void }) {
  const [companyName, setCompanyName] = useState(deal.companyName);
  const [projectTitle, setProjectTitle] = useState(deal.projectTitle);
  const [contactPerson, setContactPerson] = useState(deal.contactPerson);
  const [phone, setPhone] = useState(deal.phone);
  const [email, setEmail] = useState(deal.email);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(deal.assignedEmployeeId ?? "");
  return (
    <Modal open={open} title="Edit Lead Details" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="edit-lead" type="submit">Save Changes</Button></>}>
      <form id="edit-lead" className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        void updatePipelineProfile(deal.id, { companyName, projectTitle, contactPerson, phone, email: email || undefined, assignedEmployeeId: assignedEmployeeId || undefined }).then(onSaved);
      }}>
        <Input label="Company Name" value={companyName} required onChange={(event) => setCompanyName(event.target.value)} />
        <Input label="Project / Requirement Item" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Contact Person" value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} />
          <Input label="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Input label="Email Address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Select label="Assigned To" value={assignedEmployeeId} onChange={(event) => setAssignedEmployeeId(event.target.value)}>
            <option value="">Unassigned</option>
            {deal.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-slate-100 px-3 py-3 md:border-r">
      <p className="text-[10px] font-extrabold uppercase text-slate-400">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="whitespace-pre-line text-sm font-semibold">{value}</p>
    </div>
  );
}

function buildTimeline(deal: DealDetails): { when: string; text: string; color: string; stamp: number }[] {
  const created = new Date(deal.createdAt).getTime();
  const events: { when: string; text: string; color: string; stamp: number }[] = [];
  for (const entry of deal.dealRemarks.split("---")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^\[(.*)\|(.*)\](.*)$/);
    if (!match) {
      events.push({ when: formatCreated(deal.createdAt), text: trimmed, color: stageMeta("Discovery").hex, stamp: created });
      continue;
    }
    const stage = match[1]?.trim() ?? "Discovery";
    const when = match[2]?.trim() ?? "";
    events.push({
      when,
      text: match[3]?.trim() ?? "",
      color: stageMeta(stage).hex,
      stamp: Date.parse(when.replace(" ", "T")) || created,
    });
  }
  for (const quote of deal.quotations) {
    const stamp = new Date(quote.createdAt).getTime();
    events.push({
      when: formatStamp(quote.createdAt),
      text: `Quotation Generated${quote.isFinal ? " FINAL" : ""}\nQuotation ${quote.quotationNumber} has been generated (${formatPiAmount(quote.totalAmount, quote.currency)}).`,
      color: "#0d6efd",
      stamp: Number.isNaN(stamp) ? created : stamp,
    });
  }
  for (const order of deal.deliveryOrders) {
    const stamp = new Date(order.createdAt || order.deliveryDate).getTime();
    events.push({
      when: formatStamp(order.createdAt || order.deliveryDate),
      text: `Delivery Order Created\nDelivery Order ${order.deliveryNumber} has been mapped to this deal.`,
      color: "#198754",
      stamp: Number.isNaN(stamp) ? created : stamp,
    });
  }
  return events.sort((left, right) => right.stamp - left.stamp);
}

function formatClosing(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function formatStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatCreated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
