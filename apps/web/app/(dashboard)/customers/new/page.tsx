"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CreateCustomerModal } from "@/components/customers/create-customer-modal";
import { Spinner } from "@/components/ui";
import type { Customer } from "@/types/customer";

function NewCustomerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromHr = searchParams.get("from") === "hr";
  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    router.push(fromHr ? "/hr/clients" : "/customers");
  }

  function handleCreated(customer: Customer) {
    setOpen(false);
    router.push(`/customers/${customer.id}`);
  }

  return (
    <CreateCustomerModal
      open={open}
      onClose={handleClose}
      onCreated={handleCreated}
    />
  );
}

export default function NewCustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <NewCustomerPageInner />
    </Suspense>
  );
}
