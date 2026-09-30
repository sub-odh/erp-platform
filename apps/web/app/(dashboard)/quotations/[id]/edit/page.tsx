"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { QuotationForm, type QuotationFormValues } from "@/components/quotations/quotation-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCustomers } from "@/lib/customers";
import { getLeads } from "@/lib/leads";
import { getQuotation, updateQuotation } from "@/lib/quotations";
import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [values, setValues] = useState<QuotationFormValues | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getQuotation(params.id),
      getCustomers({ limit: 200, isActive: true }).catch(() => ({ data: [] as Customer[] })),
      getLeads({ limit: 100 }).catch(() => ({ data: [] as Lead[] })),
    ])
      .then(([details, customerPage, leadPage]) => {
        if (!active) return;
        setCustomers(customerPage.data);
        setLeads(leadPage.data);
        setValues({
          quotationNumber: details.quotationNumber,
          quotationDate: details.quotationDate,
          expiryDate: details.expiryDate ?? "",
          leadId: details.leadId ?? "",
          customerId: details.customerId ?? "CUSTOM",
          customerName: details.customerName,
          customerAddress: details.customerAddress,
          currency: details.currency,
          vatApplicable: details.vatApplicable === 1,
          termsConditions: details.termsConditions,
          items: details.items.length
            ? details.items.map((item) => ({
                itemName: item.itemName,
                description: item.description ?? "",
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
              }))
            : [{ itemName: "", description: "", quantity: 1, unitPrice: 0 }],
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Quotation not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function save() {
    if (!values) return;
    if (!values.customerName.trim() || !values.quotationDate) {
      setError("Mandatory validation failure: Customer identities and reference issue date anchors required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateQuotation(params.id, {
        quotationNumber: values.quotationNumber,
        quotationDate: values.quotationDate,
        expiryDate: values.expiryDate,
        leadId: values.leadId || undefined,
        customerId: values.customerId && values.customerId !== "CUSTOM" ? values.customerId : undefined,
        customerName: values.customerName.trim(),
        customerAddress: values.customerAddress,
        currency: values.currency,
        vatApplicable: values.currency === "NPR" && values.vatApplicable,
        termsConditions: values.termsConditions,
        items: values.items,
      });
      router.push("/quotations?msg=update_success");
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "The quotation could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !values) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!values) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <QuotationForm
      title="Edit Customer Quotation"
      values={values}
      customers={customers}
      leads={leads}
      saving={saving}
      error={error}
      onChange={setValues}
      onSubmit={() => void save()}
      onCancel={() => router.push("/quotations")}
      termsAlreadyEdited
    />
  );
}
