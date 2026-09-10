"use client";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  Mail,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button, Input, Select } from "@/components/ui";
import {
  getSmtpConfiguration,
  testSmtpConfiguration,
  updateSmtpConfiguration,
} from "@/lib/smtp";
import type {
  SmtpConfiguration,
  SmtpEncryption,
  UpdateSmtpConfigurationInput,
} from "@/types/smtp";

interface SmtpForm {
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: SmtpEncryption;
  fromEmail: string;
  senderName: string;
  isActive: boolean;
}

const initialForm: SmtpForm = {
  host: "",
  port: "587",
  username: "",
  password: "",
  encryption: "STARTTLS",
  fromEmail: "",
  senderName: "ERP System",
  isActive: true,
};

export default function SmtpSettingsPage() {
  const [form, setForm] = useState<SmtpForm>(initialForm);
  const [configuration, setConfiguration] = useState<SmtpConfiguration | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadConfiguration();
  }, []);

  async function loadConfiguration(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const result = await getSmtpConfiguration();
      setConfiguration(result);

      if (result) {
        setForm({
          host: result.host,
          port: String(result.port),
          username: result.username,
          password: "",
          encryption: result.encryption,
          fromEmail: result.fromEmail,
          senderName: result.senderName,
          isActive: result.isActive,
        });
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load SMTP settings."));
    } finally {
      setLoading(false);
    }
  }

  function updateField<Key extends keyof SmtpForm>(
    key: Key,
    value: SmtpForm[Key],
  ): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: UpdateSmtpConfigurationInput = {
      host: form.host.trim(),
      port: Number(form.port),
      username: form.username.trim(),
      encryption: form.encryption,
      fromEmail: form.fromEmail.trim().toLowerCase(),
      senderName: form.senderName.trim(),
      isActive: form.isActive,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      const result = await updateSmtpConfiguration(payload);
      setConfiguration(result);
      setForm((current) => ({ ...current, password: "" }));
      setMessage(
        "SMTP configuration saved. Test the connection before relying on email notifications.",
      );
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save SMTP settings."));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(): Promise<void> {
    setTesting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await testSmtpConfiguration();
      const refreshed = await getSmtpConfiguration();
      setConfiguration(refreshed);

      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (requestError) {
      const failure = errorMessage(
        requestError,
        "SMTP connection test failed.",
      );

      try {
        setConfiguration(await getSmtpConfiguration());
      } catch {
        // Preserve the connection-test error when refreshing status also fails.
      }

      setError(failure);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex items-start gap-4">
        <div className="rounded-xl bg-blue-600 p-3 text-white">
          <Send size={24} />
        </div>

        <div>
          <p className="text-sm font-medium text-blue-600">Administration</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            SMTP Configuration
          </h1>
          <p className="mt-2 text-slate-500">
            Configure the outgoing email server for company notifications.
          </p>
        </div>
      </div>

      <Feedback message={message} error={error} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="SMTP host"
              placeholder="smtp.gmail.com"
              value={form.host}
              onChange={(event) => updateField("host", event.target.value)}
              required
            />

            <Input
              label="Port"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(event) => updateField("port", event.target.value)}
              required
            />

            <Input
              label="Username / email"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              placeholder={
                configuration?.hasPassword
                  ? "Leave blank to keep saved password"
                  : "Email app password"
              }
              onChange={(event) => updateField("password", event.target.value)}
              required={!configuration?.hasPassword}
            />

            <Select
              label="Encryption"
              value={form.encryption}
              onChange={(event) =>
                updateField("encryption", event.target.value as SmtpEncryption)
              }
              required
            >
              <option value="STARTTLS">STARTTLS</option>
              <option value="SSL">SSL / TLS</option>
              <option value="NONE">None (Not Recommended)</option>
            </Select>

            <label className="flex items-end">
              <span className="flex h-11 w-full items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Enable email delivery for this company
              </span>
            </label>
          </div>

          <div className="my-7 border-t border-slate-200" />

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="From Email Address"
              type="email"
              value={form.fromEmail}
              onChange={(event) => updateField("fromEmail", event.target.value)}
              required
            />

            <Input
              label="Sender Name"
              value={form.senderName}
              onChange={(event) =>
                updateField("senderName", event.target.value)
              }
              required
            />
          </div>

          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              loading={testing}
              disabled={!configuration || !form.isActive || saving}
              onClick={() => void handleTest()}
            >
              <Mail size={17} /> Test connection
            </Button>

            <Button type="submit" loading={saving} disabled={testing}>
              <Save size={17} /> Save configuration
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <InfoCard />
          <PortCard />
          {configuration ? <StatusCard configuration={configuration} /> : null}
        </aside>
      </div>
    </div>
  );
}

function InfoCard() {
  return (
    <div className="rounded-xl bg-slate-900 p-5 text-slate-100 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold">
        <Info size={17} className="text-cyan-400" /> Gmail setup
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Gmail requires 2-Step Verification and an App Password. A regular Google
        account password will not work.
      </p>
    </div>
  );
}

function PortCard() {
  return (
    <div className="rounded-xl bg-cyan-500 p-5 text-white shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldCheck size={18} /> Port reference
      </h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>587: STARTTLS (recommended)</li>
        <li>465: SSL / TLS</li>
        <li>25: Unencrypted (not recommended)</li>
      </ul>
    </div>
  );
}

function StatusCard({ configuration }: { configuration: SmtpConfiguration }) {
  const success = configuration.lastTestSucceeded === true;
  const failed = configuration.lastTestSucceeded === false;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        {success ? (
          <CheckCircle2 size={18} className="text-emerald-600" />
        ) : (
          <CircleAlert
            size={18}
            className={failed ? "text-red-600" : "text-amber-500"}
          />
        )}
        Connection status
      </h2>
      <p className="mt-3 text-sm text-slate-600">
        {success
          ? "The last connection test succeeded."
          : failed
            ? "The last connection test failed."
            : "Configuration saved; connection not tested yet."}
      </p>
      {configuration.lastTestedAt ? (
        <p className="mt-2 text-xs text-slate-500">
          Tested {new Date(configuration.lastTestedAt).toLocaleString()}
        </p>
      ) : null}
      {configuration.lastError ? (
        <p className="mt-3 break-words rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {configuration.lastError}
        </p>
      ) : null}
    </div>
  );
}

function Feedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  return (
    <>
      {message ? (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading SMTP settings...</p>
      </div>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
