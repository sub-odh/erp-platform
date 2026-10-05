"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui";
import { getCurrentCompany } from "@/lib/company";
import { getSupportVisit } from "@/lib/visits";
import type { Company } from "@/types/company";
import type { SupportVisit, SupportVisitType } from "@/types/visit";

export default function SupportVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<SupportVisit | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissing(false);

    try {
      const [nextVisit, nextCompany] = await Promise.all([
        getSupportVisit(params.id),
        getCurrentCompany().catch(() => null),
      ]);
      setVisit(nextVisit);
      setCompany(nextCompany);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this support visit.";

      if (/not found/i.test(message)) {
        setMissing(true);
        setVisit(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setGeneratedAt(formatGenerated(new Date()));
  }, []);

  useEffect(() => {
    if (!visit) {
      return;
    }

    const print = new URLSearchParams(window.location.search).get("print");

    if (print !== "true") {
      return;
    }

    const timer = window.setTimeout(() => window.print(), 300);

    return () => window.clearTimeout(timer);
  }, [visit]);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (missing || !visit) {
    return (
      <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        {error ?? "Visit record not found."}
      </div>
    );
  }

  const lead = visit.technicianName?.trim() ?? "";
  const members = teamLines(lead, visit.teamMembers);
  const logo = company?.invoiceLogoUrl || company?.logoUrl || null;

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <div className="visit-no-print mx-auto mb-3 flex max-w-[850px] items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/hr/support-visits")}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={14} className="mr-1" aria-hidden />
          Back to All Visits
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
        >
          <Printer size={14} className="mr-2" aria-hidden />
          Print Report
        </button>
      </div>

      <article className="visit-report mx-auto max-w-[850px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="visit-banner bg-[#5d6693] px-6 py-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {logo ? (
                <img src={logo} alt="Logo" className="max-h-[55px] w-auto" />
              ) : null}
              <div>
                <h1 className="text-base font-bold tracking-wide">
                  IT SERVICE VISIT REPORT
                </h1>
                <p className="text-sm opacity-90">Ref: {visit.visitNumber}</p>
              </div>
            </div>
            <div className="shrink-0 text-right text-[0.8rem] font-bold">
              DATE: {formatReportDate(visit.visitDate)}
            </div>
          </div>
        </div>

        <Section number="01" title="Assignment Information" />
        <div className="grid gap-6 p-4 md:grid-cols-3">
          <Field label="Client Name" value={visit.clientName} />
          <Field label="Department / Branch" value={visit.deptName?.trim() || "N/A"} />
          <div>
            <FieldLabel>Personnel & Team</FieldLabel>
            <div className="min-h-8 border-b-[1.5px] border-slate-100 py-1.5 text-[0.9rem] font-semibold text-slate-800">
              {lead ? <div className="font-bold">{lead}</div> : null}
              {members.map((member) => (
                <div
                  key={member}
                  className="mt-0.5 border-t border-dashed border-slate-100 pt-0.5 text-[0.85rem] font-normal"
                >
                  {member}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Section number="02" title="Schedule & Mode" />
        <div className="visit-schedule bg-[#3d456e] px-4 py-4 text-white">
          <div className="flex flex-nowrap items-center gap-[15px]">
            <ScheduleCell label="Time In" value={formatClock(visit.timeStarted)} />
            <ScheduleCell
              label="Time Out"
              value={visit.timeEnded ? formatClock(visit.timeEnded) : "--:--"}
            />
            <div className="min-w-0 flex-1 text-center">
              <div className="visit-duration inline-block whitespace-nowrap rounded-lg bg-[#c8401e] px-2 py-2 text-center text-white">
                <small className="block text-[0.6rem] font-bold">DURATION</small>
                <span className="font-bold">{visit.totalHours?.trim() || "0h 00m"}</span>
              </div>
            </div>
            <ScheduleCell
              label="Service Mode"
              value={serviceModeLabel(visit.visitType)}
              wide
            />
          </div>
        </div>

        <Section number="03" title="Work Summary" />
        <div className="p-4">
          <div className="mb-4">
            <FieldLabel>Reported Issue</FieldLabel>
            <div className="visit-log mt-2 min-h-[50px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-[0.9rem] leading-relaxed text-slate-800">
              {visit.issueDescription ?? ""}
            </div>
          </div>
          <div>
            <FieldLabel>Actions Taken / Resolution</FieldLabel>
            <div
              className="visit-log visit-log-action mt-2 min-h-[50px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-[0.9rem] leading-relaxed text-slate-800"
              style={{ borderLeft: "4px solid #1a3a5c" }}
            >
              {visit.actionTaken ?? ""}
            </div>
          </div>
        </div>

        <div className="visit-signatures hidden justify-between px-10 pb-10 pt-20">
          <div className="w-[250px] border-t-2 border-black pt-2.5 text-center text-[0.85rem] font-bold text-black">
            Technician Signature
            <br />
            <small className="font-normal">{lead}</small>
          </div>
          <div className="w-[250px] border-t-2 border-black pt-2.5 text-center text-[0.85rem] font-bold text-black">
            Client Acknowledgment
            <br />
            <small className="font-normal">Stamp & Date</small>
          </div>
        </div>

        <div className="visit-no-print flex justify-end border-t border-slate-200 bg-slate-50 p-3">
          <small className="text-slate-500">
            Generated by System on {generatedAt}
          </small>
        </div>
      </article>
    </div>
  );
}

function Section({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
      <span className="visit-section-num rounded bg-[#1a3a5c] px-2 py-0.5 text-[11px] font-bold text-white">
        {number}
      </span>
      <span className="text-xs font-bold uppercase text-slate-600">{title}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="min-h-8 border-b-[1.5px] border-slate-100 py-1.5 text-[0.9rem] font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div className="mb-[3px] block text-[0.65rem] font-bold uppercase text-slate-400">
      {children}
    </div>
  );
}

function ScheduleCell({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "min-w-0 flex-[1.5]" : "min-w-0 flex-1"}>
      <div className="mb-[3px] text-[0.65rem] font-bold uppercase text-white/50">
        {label}
      </div>
      <div className="whitespace-nowrap py-1.5 text-[0.9rem] font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function teamLines(lead: string, team: string | null): string[] {
  if (!team?.trim()) {
    return [];
  }

  const leadKey = lead.trim().toLowerCase();

  return team
    .split(/[,;\n\r]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== leadKey);
}

function serviceModeLabel(type: SupportVisitType): string {
  if (type === "ONPREMISE") {
    return "Onpremise";
  }

  if (type === "ONCALL") {
    return "Oncall";
  }

  return "Remote";
}

function formatReportDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  const formatted = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return formatted.replace(/ (\d{4})$/, ", $1");
}

function formatClock(value: string | null): string {
  if (!value) {
    return "--:--";
  }

  const [hour, minute] = value.split(":");

  if (!hour || minute === undefined) {
    return value;
  }

  return `${hour.padStart(2, "0")}:${minute.slice(0, 2)}`;
}

function formatGenerated(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hour}:${minute}`;
}

const PRINT_CSS = `
@media print {
  @page { margin: 0; size: auto; }
  aside, header, footer { display: none !important; }
  body { background: #fff !important; margin: 0; padding: 1.5cm; }
  main { padding: 0 !important; background: #fff !important; }
  .min-h-screen > div { padding-left: 0 !important; background: #fff !important; }
  .visit-no-print { display: none !important; }
  .visit-report {
    border: 1px solid #000 !important;
    box-shadow: none !important;
    max-width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }
  .visit-banner, .visit-schedule, .visit-section-num, .visit-duration {
    background: transparent !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }
  .visit-banner *, .visit-schedule *, .visit-section-num, .visit-duration, .visit-duration * {
    color: #000 !important;
    opacity: 1 !important;
  }
  .visit-log {
    background: transparent !important;
    border: 1px solid #000 !important;
    color: #000 !important;
  }
  .visit-log-action { border-left-width: 4px !important; }
  .visit-signatures { display: flex !important; }
}
`;
