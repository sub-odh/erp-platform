"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getAccessToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAccessToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-500">Loading workspace...</p>
    </main>
  );
}
