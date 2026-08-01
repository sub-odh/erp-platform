"use client";

import { Building2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import type { LoginResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();

  const [organizationCode, setOrganizationCode] = useState("MYCOMPANY");

  const [email, setEmail] = useState("admin@mycompany.com");

  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          organizationCode,
          email,
          password,
        }),
      });

      saveAuthSession(response);
      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to log in",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3">
            <Building2 size={28} />
          </div>

          <div>
            <p className="text-xl font-semibold">ERP Platform</p>
            <p className="text-sm text-slate-400">Business management system</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            One platform
          </p>

          <h1 className="text-5xl font-semibold leading-tight">
            Manage your company from a single workspace.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Secure organization access, users, inventory, sales, purchasing, and
            reporting.
          </p>
        </div>

        <p className="text-sm text-slate-500">© 2026 ERP Platform</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">Welcome back</p>

            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your organization and account details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Organization code
              </span>

              <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Building2 size={18} className="text-slate-400" />

                <input
                  value={organizationCode}
                  onChange={(event) => setOrganizationCode(event.target.value)}
                  className="w-full border-0 bg-transparent py-3 outline-none"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </span>

              <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail size={18} className="text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border-0 bg-transparent py-3 outline-none"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>

              <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <LockKeyhole size={18} className="text-slate-400" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-0 bg-transparent py-3 outline-none"
                  required
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
