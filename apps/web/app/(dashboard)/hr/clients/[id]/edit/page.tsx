"use client";

import { List } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ClientForm, type ClientFormValues } from "@/components/clients/client-form";
import { Button, Spinner } from "@/components/ui";
import {
  getCustomer,
  updateCustomer,
  uploadCustomerLogo,
} from "@/lib/customers";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params.id;
  const [initialValues, setInitialValues] = useState<ClientFormValues | null>(
    null,
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customer = await getCustomer(customerId);
      setInitialValues({
        name: customer.name,
        taxNumber: customer.taxNumber ?? "",
        address: customer.address ?? customer.billingAddressLine1 ?? "",
        contactPerson: customer.contactPerson ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
      });
      setLogoUrl(customer.logoUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the client.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(values: ClientFormValues, logo: File | null) {
    if (!customerId) {
      return;
    }

    const name = values.name.trim();
    const contactPerson = values.contactPerson.trim();

    if (!name) {
      setError("Client name is required.");
      return;
    }

    if (!contactPerson) {
      setError("Primary contact person is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateCustomer(customerId, {
        name,
        contactPerson,
        taxNumber: values.taxNumber.trim(),
        address: values.address.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      });

      if (logo) {
        await uploadCustomerLogo(customerId, logo);
      }

      router.push("/hr/clients");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the client.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !initialValues) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ClientForm
      title="Edit Client"
      subtitle="Update customer records and contact details"
      headerAction={
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => router.push("/hr/clients")}
        >
          <List size={16} />
          View All Clients
        </Button>
      }
      initialValues={initialValues ?? undefined}
      existingLogoUrl={logoUrl}
      submitLabel="Save Client"
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
