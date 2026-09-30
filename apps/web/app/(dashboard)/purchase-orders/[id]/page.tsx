"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PurchaseOrderRecordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/purchase-orders/${params.id}/print`);
  }, [params.id, router]);

  return null;
}
