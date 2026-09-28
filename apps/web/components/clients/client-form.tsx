"use client";

import { CloudUpload } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button, Input, Textarea } from "@/components/ui";
import { AuthenticatedImage } from "@/components/media/authenticated-image";

export interface ClientFormValues {
  name: string;
  taxNumber: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
}

interface ClientFormProps {
  title: string;
  subtitle: string;
  headerAction: ReactNode;
  initialValues?: ClientFormValues;
  existingLogoUrl?: string | null;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: ClientFormValues, logo: File | null) => Promise<void> | void;
}

const EMPTY: ClientFormValues = {
  name: "",
  taxNumber: "",
  address: "",
  contactPerson: "",
  email: "",
  phone: "",
};

export function ClientForm({
  title,
  subtitle,
  headerAction,
  initialValues,
  existingLogoUrl,
  submitLabel,
  submitting,
  error,
  onSubmit,
}: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>(
    initialValues ?? EMPTY,
  );
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateField(key: keyof ClientFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleLogoChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setLogo(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values, logo);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {headerAction}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center border-slate-200 lg:border-r lg:pr-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Client Logo
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="relative flex h-36 w-36 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-blue-400 hover:bg-blue-50"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-full w-full object-contain p-2"
                  />
                ) : existingLogoUrl ? (
                  <AuthenticatedImage
                    src={existingLogoUrl}
                    alt=""
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <>
                    <CloudUpload size={28} className="mb-2" />
                    <span className="text-xs">Click to upload</span>
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) =>
                  handleLogoChange(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Input
                  label="Client Name"
                  required
                  value={values.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  label="VAT/PAN Number"
                  value={values.taxNumber}
                  onChange={(event) =>
                    updateField("taxNumber", event.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-12">
                <Textarea
                  label="Address"
                  rows={2}
                  className="min-h-[72px]"
                  value={values.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="Primary Contact Person"
                  required
                  value={values.contactPerson}
                  onChange={(event) =>
                    updateField("contactPerson", event.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="Phone Number"
                  value={values.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button type="submit" loading={submitting} className="rounded-full px-8">
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
