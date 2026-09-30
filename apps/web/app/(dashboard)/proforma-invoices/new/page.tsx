"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PiDispatchView } from "@/components/proforma/pi-dispatch-view";
import {
  emptyProformaLines,
  ProformaForm,
  type ProformaFormValues,
} from "@/components/proforma/proforma-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCurrentCompany } from "@/lib/company";
import { createProformaInvoice, dispatchProformaInvoice, getProformaDraft } from "@/lib/proforma-invoices";
import type { Company } from "@/types/company";
import type { SaveProformaInput } from "@/types/proforma-invoices";

export default function CreateProformaInvoicePage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [values, setValues] = useState<ProformaFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentCompany().catch(() => null), getProformaDraft()])
      .then(([currentCompany, draft]) => {
        if (!active) return;
        setCompany(currentCompany);
        setValues({
          piNumber: draft.piNumber,
          piDate: draft.piDate,
          customerDetails: "",
          billTo: "",
          shipTo: "",
          termsConditions: "",
          currency: "NPR",
          items: emptyProformaLines(),
          creatorName: draft.creatorName,
          creatorPosition: draft.creatorPosition,
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "The draft could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(payload: SaveProformaInput) {
    setSaving(true);
    setError(null);
    try {
      const created = await createProformaInvoice(payload);
      router.push(`/proforma-invoices/${created.id}/print`);
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Error generating Proforma Invoice.");
      setSaving(false);
    }
  }

  async function send(input: {
    recipientEmail: string;
    emailSubject: string;
    emailBodyNotes: string;
  }) {
    if (!values) return;
    setDispatching(true);
    setDispatchError(null);
    try {
      const result = await dispatchProformaInvoice({
        ...input,
        piNumber: values.piNumber,
      });
      setDispatchOpen(false);
      setNotice(result.message);
    } catch (reason: unknown) {
      setDispatchError(
        reason instanceof ApiError ? reason.message : "The email could not be sent.",
      );
    } finally {
      setDispatching(false);
    }
  }

  if (!values && !error) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!values) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  return (
    <>
      {notice ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}
      <ProformaForm
        company={company}
        values={values}
        saving={saving}
        error={error}
        onSave={save}
        onDispatch={() => {
          setDispatchError(null);
          setDispatchOpen(true);
        }}
      />
      <PiDispatchView
        open={dispatchOpen}
        piNumber={values.piNumber}
        loading={dispatching}
        error={dispatchError}
        onSubmit={send}
        onClose={() => setDispatchOpen(false)}
      />
    </>
  );
}
