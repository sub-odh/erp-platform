"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuotationDetailRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/quotations/${params.id}/print`);
  }, [params.id, router]);
  return null;
}
