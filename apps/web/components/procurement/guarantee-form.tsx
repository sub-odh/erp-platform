"use client";

import { useState, type FormEvent } from "react";

import { Button, Input, Select, Textarea } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { formatCalendarDate } from "@/lib/nepali-date";
import { createGuarantee, updateGuarantee, uploadGuaranteeDocument } from "@/lib/procurement";
import type { Guarantee, GuaranteeType } from "@/types/procurement";

interface GuaranteeFormProps {
  guarantee?: Guarantee | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function GuaranteeForm({
  guarantee = null,
  onCancel,
  onSaved,
}: GuaranteeFormProps) {
  const { system } = useCalendarSystem();
  const editing = Boolean(guarantee);

  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>(
    guarantee?.guaranteeType ?? "BG",
  );
  const [clientName, setClientName] = useState(guarantee?.clientName ?? "");
  const [bankNameBranch, setBankNameBranch] = useState(
    guarantee?.bankNameBranch ?? "",
  );
  const [amount, setAmount] = useState(guarantee?.amount ?? "");
  const [submissionDate, setSubmissionDate] = useState(
    guarantee?.submissionDate ?? "",
  );
  const [expiryDate, setExpiryDate] = useState(guarantee?.expiryDate ?? "");
  const [assignedPerson, setAssignedPerson] = useState(
    guarantee?.assignedPerson ?? "",
  );
  const [tenderDetails, setTenderDetails] = useState(
    guarantee?.tenderDetails ?? "",
  );
  const [document, setDocument] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const uploaded = document
        ? await uploadGuaranteeDocument(document)
        : null;

      const payload = {
        guaranteeType,
        clientName: clientName.trim(),
        tenderDetails: tenderDetails.trim(),
        bankNameBranch: bankNameBranch.trim(),
        amount: Number(amount),
        submissionDate,
        expiryDate,
        assignedPerson: assignedPerson.trim() || null,
        documentUrl: uploaded?.url ?? guarantee?.documentUrl ?? null,
      };

      if (guarantee) {
        await updateGuarantee(guarantee.id, payload);
      } else {
        await createGuarantee(payload);
      }

      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to register this guarantee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,.1)]"
    >
      <div>
        <h2 className="text-base font-bold text-blue-700">
          {editing
            ? "Update Guarantee"
            : "Provision Asset Commitment Parameter Entry"}
        </h2>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Select
          label="Commitment Classification"
          name="guaranteeType"
          required
          value={guaranteeType}
          onChange={(event) =>
            setGuaranteeType(event.target.value as GuaranteeType)
          }
        >
          <option value="BG">BG - Bank Guarantee</option>
          <option value="PG">PG - Performance Guarantee</option>
        </Select>

        <Input
          label="Client Name"
          name="clientName"
          required
          maxLength={255}
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Nepal Telecom"
        />

        <Input
          label="Bank Issuer Identity & Target Branch Location"
          name="bankNameBranch"
          required
          maxLength={255}
          value={bankNameBranch}
          onChange={(event) => setBankNameBranch(event.target.value)}
          placeholder="Himalayan Bank, New Road"
        />

        <Input
          label="Total Committed Valuation Amount (Rs.)"
          name="amount"
          type="number"
          required
          min={0}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />

        <Input
          label="Date of Official Submission"
          name="submissionDate"
          type="date"
          required
          value={submissionDate}
          onChange={(event) => setSubmissionDate(event.target.value)}
          hint={
            system === "BS" && submissionDate
              ? formatCalendarDate(submissionDate, "BS")
              : undefined
          }
        />

        <Input
          label="Horizon End / Expiry Date"
          name="expiryDate"
          type="date"
          required
          value={expiryDate}
          onChange={(event) => setExpiryDate(event.target.value)}
          hint={
            system === "BS" && expiryDate
              ? formatCalendarDate(expiryDate, "BS")
              : undefined
          }
        />

        <Input
          label="Assigned Bank Representative Officer Identity Details"
          name="assignedPerson"
          maxLength={155}
          value={assignedPerson}
          onChange={(event) => setAssignedPerson(event.target.value)}
          placeholder="Relationship officer"
        />

        <Input
          label="Supporting Document"
          name="document"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
          hint="PDF, PNG or JPEG up to 5 MB"
          className="py-2"
        />
      </div>

      <Textarea
        label="Tender Identity Nomenclature / Structural Details Mapping Scope"
        name="tenderDetails"
        required
        rows={3}
        maxLength={5000}
        value={tenderDetails}
        onChange={(event) => setTenderDetails(event.target.value)}
        placeholder="Tender name, reference number or scope covered by this guarantee"
      />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit" loading={saving}>
          {editing ? "Update Guarantee" : "Register Guarantee"}
        </Button>
      </div>
    </form>
  );
}
