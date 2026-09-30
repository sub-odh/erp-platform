"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  blankCloudLine,
  CloudQuotationForm,
  DEFAULT_TERMS,
  type CloudFormValues,
} from "@/components/sajilocloud/cloud-quotation-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { createCloudQuotation, getCloudQuotationDraft } from "@/lib/cloud-quotations";

export default function NewCloudQuotationPage() {
  const router = useRouter();
  const [values, setValues] = useState<CloudFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCloudQuotationDraft()
      .then((draft) => {
        if (!active) return;
        setValues({
          quotationNumber: draft.quotationNumber,
          quotationDate: draft.quotationDate,
          expiryDate: draft.expiryDate,
          customerName: "",
          customerAddress: "",
          currency: "NPR",
          vatApplicable: true,
          discountType: "amount",
          discountValue: 0,
          termsConditions: draft.termsConditions || DEFAULT_TERMS,
          items: [blankCloudLine()],
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "The quotation draft could not be prepared.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!values) return;
    if (!values.customerName.trim() || !values.quotationNumber || !values.quotationDate || values.items.length === 0) {
      setError("All header fields and at least one service item line are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCloudQuotation({
        quotationNumber: values.quotationNumber,
        quotationDate: values.quotationDate,
        expiryDate: values.expiryDate,
        customerName: values.customerName.trim(),
        customerAddress: values.customerAddress,
        currency: values.currency,
        vatApplicable: values.currency === "NPR" && values.vatApplicable,
        discountType: values.discountType,
        discountValue: values.discountValue,
        termsConditions: values.termsConditions,
        items: values.items.map((line) => ({
          serviceType: line.serviceType,
          itemName: line.itemName,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      });
      router.push("/sajilocloud/quotations");
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
    <CloudQuotationForm
      title="Create Cloud Services Quotation"
      submitLabel="Save & Emit Quotation"
      values={values}
      saving={saving}
      error={error}
      onChange={setValues}
      onSubmit={() => void save()}
      onCancel={() => router.push("/sajilocloud/quotations")}
    />
  );
}
