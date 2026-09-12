"use client";

import { Car } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { canManageVisits } from "@/lib/hr-access";
import { toIsoDate } from "@/lib/nepali-date";
import {
  checkInFieldVisit,
  createFieldVisit,
  getFieldVisits,
  getMyFieldVisits,
} from "@/lib/visits";
import type { FieldVisit, FieldVisitType } from "@/types/visit";

const VISIT_TYPES: { value: FieldVisitType; label: string }[] = [
  { value: "CLIENT_MEETING", label: "Client Meeting" },
  { value: "TECHNICAL_SUPPORT", label: "Technical Support" },
  { value: "BANK", label: "Bank" },
  { value: "CUSTOMS", label: "Customs" },
  { value: "OTHER", label: "Other" },
];

export default function FieldVisitsPage() {
  const [manage, setManage] = useState(false);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [agenda, setAgenda] = useState("");
  const [visitType, setVisitType] = useState<FieldVisitType>("CLIENT_MEETING");
  const [visitDate, setVisitDate] = useState(toIsoDate(new Date()));
  const [outTime, setOutTime] = useState("09:00");
  const [inTime, setInTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    setManage(canManageVisits());
    setAccessReady(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setVisits(manage ? await getFieldVisits() : await getMyFieldVisits());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load field visits.",
      );
    } finally {
      setLoading(false);
    }
  }, [manage]);

  useEffect(() => {
    if (!accessReady) {
      return;
    }

    void load();
  }, [accessReady, load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createFieldVisit({
        agenda: agenda.trim(),
        visitType,
        visitDate,
        outTime,
        inTime: inTime || null,
        remarks: remarks.trim() || null,
      });
      setAgenda("");
      setRemarks("");
      setInTime("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the field visit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckIn(visitId: string) {
    const now = new Date();
    const value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setError(null);

    try {
      await checkInFieldVisit(visitId, value);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to check in from the field.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Car size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Field Visits
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Record time out of the office and check in when you return.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader title="New Field Visit" />
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <Input
                label="Agenda"
                required
                value={agenda}
                onChange={(event) => setAgenda(event.target.value)}
              />
            </div>
            <Select
              label="Visit Type"
              value={visitType}
              onChange={(event) =>
                setVisitType(event.target.value as FieldVisitType)
              }
            >
              {VISIT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Input
              label="Visit Date"
              type="date"
              required
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
            />
            <Input
              label="Out Time"
              type="time"
              required
              value={outTime}
              onChange={(event) => setOutTime(event.target.value)}
            />
            <Input
              label="In Time"
              type="time"
              value={inTime}
              onChange={(event) => setInTime(event.target.value)}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" loading={submitting}>
                Save Field Visit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && visits.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No field visits recorded.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Agenda
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Out / In
                </th>
                {manage ? (
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>
                ) : null}
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {visit.agenda}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {VISIT_TYPES.find((item) => item.value === visit.visitType)
                      ?.label ?? visit.visitType}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{visit.visitDate}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {visit.outTime.slice(0, 5)} / {visit.inTime?.slice(0, 5) ?? "—"}
                  </td>
                  {manage ? (
                    <td className="px-4 py-3 text-slate-600">{visit.employeeName}</td>
                  ) : null}
                  <td className="px-5 py-3 text-right">
                    {visit.inTime ? (
                      <Badge variant="success">Checked In</Badge>
                    ) : (
                      <Button size="sm" onClick={() => void handleCheckIn(visit.id)}>
                        Check In
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
