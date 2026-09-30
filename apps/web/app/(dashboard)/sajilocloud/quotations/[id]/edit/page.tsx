"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CloudQuotationForm,
  type CloudFormValues,
  type CloudLine,
} from "@/components/sajilocloud/cloud-quotation-form";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCloudQuotation, updateCloudQuotation } from "@/lib/cloud-quotations";

export default function EditCloudQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [values, setValues] = useState<CloudFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCloudQuotation(params.id)
      .then((details) => {
        if (!active) return;
        const items: CloudLine[] = details.items.length
          ? details.items.map((item) => ({
              serviceType: item.serviceType,
              itemName: item.itemName,
              description: item.description ?? "",
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              vcpu: 2,
              ram: 4,
              storage: 50,
              mailboxes: item.serviceType === "Secure Email Service" ? item.quantity : 10,
              includeGateway: (item.description ?? "").includes("Secure Email Gateway"),
            }))
          : [];
        setValues({
          quotationNumber: details.quotationNumber,
          quotationDate: details.quotationDate,
          expiryDate: details.expiryDate ?? "",
          customerName: details.customerName,
          customerAddress: details.customerAddress,
          currency: details.currency,
          vatApplicable: details.vatApplicable === 1,
          discountType: "amount",
          discountValue: Number(details.discountAmount),
          termsConditions: details.termsConditions,
          items,
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Quotation record not found.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function save() {
    if (!values) return;
    if (!values.customerName.trim() || !values.quotationDate || values.items.length === 0) {
      setError("All header fields and at least one service item line are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCloudQuotation(params.id, {
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
      title={`Edit Quotation #${values.quotationNumber}`}
      submitLabel="Update Quotation Record"
      values={values}
      saving={saving}
      error={error}
      onChange={setValues}
      onSubmit={() => void save()}
      onCancel={() => router.push("/sajilocloud/quotations")}
    />
  );
}
