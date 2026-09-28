"use client";

import { List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClientForm, type ClientFormValues } from "@/components/clients/client-form";
import { Button } from "@/components/ui";
import { createCustomer, uploadCustomerLogo } from "@/lib/customers";

export default function NewClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ClientFormValues, logo: File | null) {
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
      const customer = await createCustomer({
        name,
        contactPerson,
        taxNumber: values.taxNumber.trim() || undefined,
        address: values.address.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
      });

      if (logo) {
        await uploadCustomerLogo(customer.id, logo);
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

  return (
    <ClientForm
      title="Client Registration"
      subtitle="Onboard new customers or partner organizations"
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
      submitLabel="Save Client"
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
