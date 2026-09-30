"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PiDispatchView } from "@/components/purchase-orders/po-dispatch-view";
import {
  ProformaForm,
  type ProformaFormValues,
} from "@/components/purchase-orders/purchase-order-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getCurrentCompany } from "@/lib/company";
import {
  dispatchProformaInvoice,
  getProformaInvoice,
  updateProformaInvoice,
} from "@/lib/purchase-orders";
import type { Company } from "@/types/company";
import type { ProformaCurrency, SaveProformaInput } from "@/types/proforma-invoices";

export default function EditProformaInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [values, setValues] = useState<ProformaFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    if (getStoredUser()?.role === "HEAD") {
      router.replace(`/purchase-orders/${params.id}/print`);
      return;
    }
    let active = true;
    Promise.all([
      getCurrentCompany().catch(() => null),
      getProformaInvoice(params.id),
    ])
      .then(([currentCompany, invoice]) => {
        if (!active) return;
        setCompany(currentCompany);
        setValues({
          piNumber: invoice.piNumber,
          piDate: invoice.piDate,
          customerDetails: invoice.customerDetails,
          billTo: invoice.billTo,
          shipTo: invoice.shipTo,
          termsConditions: invoice.termsConditions,
          currency: invoice.currency as ProformaCurrency,
          creatorName: invoice.creatorName,
          creatorPosition: invoice.creatorPosition,
          items: invoice.items.map((item) => ({
            key: item.id ?? crypto.randomUUID(),
            itemName: item.itemName,
            partNumber: item.partNumber,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          })),
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "Purchase Order record not found.",
        );
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function save(payload: SaveProformaInput) {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProformaInvoice(params.id, payload);
      router.push(`/purchase-orders/${updated.id}/print`);
    } catch (reason: unknown) {
      setError(
        reason instanceof ApiError ? reason.message : "Error generating Purchase Order.",
      );
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
      await dispatchProformaInvoice({ ...input, piNumber: values.piNumber });
      setDispatchOpen(false);
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

  if (!values) return <p className="text-sm text-red-700">{error}</p>;

  return (
    <>
      <ProformaForm
        title="Edit Purchase Order"
        company={company}
        values={values}
        saving={saving}
        error={error}
        onSave={save}
        onDispatch={() => setDispatchOpen(true)}
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
