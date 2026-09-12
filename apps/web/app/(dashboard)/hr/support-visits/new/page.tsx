"use client";

import { ArrowLeft, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { getCustomers } from "@/lib/customers";
import { getEmployeeDirectory } from "@/lib/employees";
import { toIsoDate } from "@/lib/nepali-date";
import { createSupportVisit } from "@/lib/visits";
import type { Customer } from "@/types/customer";
import type { EmployeeDirectoryItem } from "@/types/employee";
import type { SupportVisitStatus, SupportVisitType } from "@/types/visit";

export default function NewSupportVisitPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deptName, setDeptName] = useState("");
  const [visitDate, setVisitDate] = useState(toIsoDate(new Date()));
  const [clientCallTime, setClientCallTime] = useState("");
  const [timeStarted, setTimeStarted] = useState("");
  const [timeEnded, setTimeEnded] = useState("");
  const [visitType, setVisitType] = useState<SupportVisitType>("ONPREMISE");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [status, setStatus] = useState<SupportVisitStatus>("PENDING");
  const [teamMembers, setTeamMembers] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 100, isActive: true }).catch(() => ({ data: [] })),
      getEmployeeDirectory().catch(() => []),
    ])
      .then(([customerResult, employees]) => {
        setCustomers(customerResult.data);
        setDirectory(employees);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load form lookups.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCustomerChange(value: string) {
    setCustomerId(value);
    const selected = customers.find((customer) => customer.id === value);
    if (selected) {
      setClientName(selected.name);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const visit = await createSupportVisit({
        clientName: clientName.trim(),
        customerId: customerId || null,
        deptName: deptName.trim() || null,
        visitDate,
        clientCallTime: clientCallTime || null,
        timeStarted: timeStarted || null,
        timeEnded: timeEnded || null,
        visitType,
        category: category.trim() || null,
        priority: priority.trim() || null,
        issueDescription: issueDescription.trim() || null,
        actionTaken: actionTaken.trim() || null,
        partsUsed: partsUsed.trim() || null,
        status,
        teamMembers: teamMembers.trim() || null,
        technicianId: technicianId || null,
      });
      router.push(`/hr/support-visits/${visit.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the support visit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/hr/my-support-visits")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        My Support Visits
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <MapPinned size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Support Visit Form
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Log remote, on-call, or on-premise support work.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Select
              label="Customer"
              value={customerId}
              onChange={(event) => handleCustomerChange(event.target.value)}
            >
              <option value="">Select Customer (Optional)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            <Input
              label="Client Name"
              required
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            />
            <Input
              label="Department Name"
              value={deptName}
              onChange={(event) => setDeptName(event.target.value)}
            />
            <Input
              label="Visit Date"
              type="date"
              required
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
            />
            <Input
              label="Client Call Time"
              type="time"
              value={clientCallTime}
              onChange={(event) => setClientCallTime(event.target.value)}
            />
            <Input
              label="Time Started"
              type="time"
              value={timeStarted}
              onChange={(event) => setTimeStarted(event.target.value)}
            />
            <Input
              label="Time Ended"
              type="time"
              value={timeEnded}
              onChange={(event) => setTimeEnded(event.target.value)}
            />
            <Select
              label="Visit Type"
              value={visitType}
              onChange={(event) =>
                setVisitType(event.target.value as SupportVisitType)
              }
            >
              <option value="ONPREMISE">On Premise</option>
              <option value="REMOTE">Remote</option>
              <option value="ONCALL">On Call</option>
            </Select>
            <Input
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <Input
              label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as SupportVisitStatus)
              }
            >
              <option value="PENDING">Pending</option>
              <option value="ONGOING">Ongoing</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </Select>
            <Select
              label="Technician"
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
            >
              <option value="">Myself (Default)</option>
              {directory.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Textarea
                label="Issue Description"
                value={issueDescription}
                onChange={(event) => setIssueDescription(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Action Taken"
                value={actionTaken}
                onChange={(event) => setActionTaken(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Parts Used"
                value={partsUsed}
                onChange={(event) => setPartsUsed(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Team Members"
                value={teamMembers}
                onChange={(event) => setTeamMembers(event.target.value)}
                placeholder="Comma-separated names"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" loading={submitting}>
                Save Support Visit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
