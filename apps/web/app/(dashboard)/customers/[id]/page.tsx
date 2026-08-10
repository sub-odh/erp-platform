"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";

import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerContactsSection } from "@/components/customers/contacts/customer-contacts-section";
import { EditCustomerModal } from "@/components/customers/edit-customer-modal";
import { Button, Spinner } from "@/components/ui";
import { getCustomer, updateCustomerStatus } from "@/lib/customers";
import type { Customer } from "@/types/customer";

export default function CustomerDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const customerId = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const [statusBusy, setStatusBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async (): Promise<void> => {
    if (!customerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getCustomer(customerId);

      setCustomer(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customer.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  async function handleToggleStatus(): Promise<void> {
    if (!customer) {
      return;
    }

    setStatusBusy(true);
    setError(null);

    try {
      const updated = await updateCustomerStatus(
        customer.id,
        !customer.isActive,
      );

      setCustomer(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update customer status.",
      );
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading && !customer) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-5">
        <Button variant="outline" onClick={() => router.push("/customers")}>
          <ArrowLeft size={17} />
          Customers
        </Button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error ?? "Customer not found."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => router.push("/customers")}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Customers
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={23} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                    {customer.name}
                  </h1>

                  <CustomerStatusBadge isActive={customer.isActive} />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="font-mono">{customer.customerCode}</span>

                  {customer.legalName ? (
                    <>
                      <span>•</span>

                      <span>{customer.legalName}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => void loadCustomer()}
              >
                <RefreshCw size={17} />
                Refresh
              </Button>

              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil size={17} />
                Edit
              </Button>

              <Button
                variant={customer.isActive ? "danger" : "success"}
                loading={statusBusy}
                onClick={() => void handleToggleStatus()}
              >
                {customer.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <InfoCard title="Contact information" icon={Building2}>
              <InfoGrid>
                <InfoItem label="Email" icon={Mail} value={customer.email} />

                <InfoItem label="Phone" icon={Phone} value={customer.phone} />

                <InfoItem label="Tax number" value={customer.taxNumber} />

                <InfoItem
                  label="Website"
                  value={customer.website}
                  link={customer.website ?? undefined}
                />
              </InfoGrid>
            </InfoCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <InfoCard title="Billing address" icon={MapPin}>
                <AddressDisplay
                  line1={customer.billingAddressLine1}
                  line2={customer.billingAddressLine2}
                  city={customer.billingCity}
                  state={customer.billingState}
                  postalCode={customer.billingPostalCode}
                  country={customer.billingCountry}
                />
              </InfoCard>

              <InfoCard title="Shipping address" icon={Truck}>
                <AddressDisplay
                  line1={customer.shippingAddressLine1}
                  line2={customer.shippingAddressLine2}
                  city={customer.shippingCity}
                  state={customer.shippingState}
                  postalCode={customer.shippingPostalCode}
                  country={customer.shippingCountry}
                />
              </InfoCard>
            </div>

            <InfoCard title="Notes">
              {customer.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {customer.notes}
                </p>
              ) : (
                <EmptyValue text="No notes have been added." />
              )}
            </InfoCard>

            <CustomerContactsSection customerId={customer.id} />
          </div>

          <div className="space-y-6">
            <InfoCard title="Financial terms" icon={CreditCard}>
              <div className="space-y-5">
                <Metric
                  label="Credit limit"
                  value={formatMoney(customer.creditLimit)}
                />

                <Metric
                  label="Payment terms"
                  value={
                    customer.paymentTermsDays === 0
                      ? "Due immediately"
                      : `${customer.paymentTermsDays} days`
                  }
                />
              </div>
            </InfoCard>

            <InfoCard title="Record information" icon={CalendarDays}>
              <div className="space-y-5">
                <Metric
                  label="Created"
                  value={formatDateTime(customer.createdAt)}
                />

                <Metric
                  label="Last updated"
                  value={formatDateTime(customer.updatedAt)}
                />
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      <EditCustomerModal
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onUpdated={(updated) => {
          setCustomer(updated);

          setEditOpen(false);
        }}
      />
    </>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;

  icon?: ComponentType<{
    size?: number;
    className?: string;
  }>;

  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        {Icon ? <Icon size={18} className="text-slate-500" /> : null}

        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function InfoItem({
  label,
  value,
  icon: Icon,
  link,
}: {
  label: string;

  value: string | null;

  icon?: ComponentType<{
    size?: number;
    className?: string;
  }>;

  link?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
        {Icon ? <Icon size={15} className="shrink-0 text-slate-400" /> : null}

        {value ? (
          link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              {value}

              <ExternalLink size={13} />
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

function AddressDisplay({
  line1,
  line2,
  city,
  state,
  postalCode,
  country,
}: {
  line1: string | null;

  line2: string | null;

  city: string | null;

  state: string | null;

  postalCode: string | null;

  country: string | null;
}) {
  const locality = [city, state, postalCode].filter(Boolean).join(", ");

  const lines = [line1, line2, locality || null, country].filter(
    (value): value is string => Boolean(value),
  );

  if (lines.length === 0) {
    return <EmptyValue text="No address has been added." />;
  }

  return (
    <address className="space-y-1 text-sm not-italic leading-6 text-slate-600">
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </address>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function EmptyValue({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function formatMoney(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
