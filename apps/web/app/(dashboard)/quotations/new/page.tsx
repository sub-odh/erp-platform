"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { QuotationForm, type QuotationFormValues } from "@/components/quotations/quotation-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCustomers } from "@/lib/customers";
import { getLeads } from "@/lib/leads";
import { createQuotation, getQuotationDraft } from "@/lib/quotations";
import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";

const EMPTY: QuotationFormValues = {
  quotationNumber: "",
  quotationDate: "",
  expiryDate: "",
  leadId: "",
  customerId: "",
  customerName: "",
  customerAddress: "",
  currency: "NPR",
  vatApplicable: true,
  termsConditions: "",
  items: [{ itemName: "", description: "", quantity: 1, unitPrice: 0 }],
};

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<QuotationFormValues>(EMPTY);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getQuotationDraft(),
      getCustomers({ limit: 200, isActive: true }).catch(() => ({ data: [] as Customer[] })),
      getLeads({ limit: 100 }).catch(() => ({ data: [] as Lead[] })),
    ]).then(([draft, customerPage, leadPage]) => {
      if (!active) return;
      setValues((current) => ({
        ...current,
        quotationNumber: draft.quotationNumber,
        quotationDate: draft.quotationDate,
        expiryDate: draft.expiryDate,
        termsConditions: draft.termsConditions,
        leadId: searchParams.get("leadId") ?? "",
        customerId: searchParams.get("customerName") ? "CUSTOM" : current.customerId,
        customerName: searchParams.get("customerName") ?? current.customerName,
      }));
      setCustomers(customerPage.data);
      setLeads(leadPage.data);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    const name = values.customerName.trim();
    if (!name || !values.quotationNumber || !values.quotationDate || values.items.length === 0) {
      setError(
        "Operational parameters restriction: All header variables and at least one line item must be validated.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createQuotation({
        quotationNumber: values.quotationNumber,
        quotationDate: values.quotationDate,
        expiryDate: values.expiryDate,
        leadId: values.leadId || undefined,
        customerId: values.customerId && values.customerId !== "CUSTOM" ? values.customerId : undefined,
        customerName: name,
        customerAddress: values.customerAddress,
        currency: values.currency,
        vatApplicable: values.currency === "NPR" && values.vatApplicable,
        termsConditions: values.termsConditions,
        items: values.items,
      });
      router.push("/quotations?msg=creation_success");
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "The quotation could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <QuotationForm
      title="Generate Customer Quotation"
      values={values}
      customers={customers}
      leads={leads}
      saving={saving}
      error={error}
      onChange={setValues}
      onSubmit={() => void save()}
      onCancel={() => router.push("/quotations")}
    />
  );
}
