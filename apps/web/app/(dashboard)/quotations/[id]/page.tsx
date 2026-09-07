"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getCurrentCompany, resolveMediaUrl } from "@/lib/company";
import { getQuotation } from "@/lib/quotations";
import type { Company } from "@/types/company";
import type { QuotationDetails } from "@/types/quotations";

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationDocumentPage() {
  const params = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getQuotation(params.id), getCurrentCompany()])
      .then(([quotationResult, companyResult]) => {
        setQuotation(quotationResult);
        setCompany(companyResult);
      })
      .catch((cause) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Unable to load quotation.",
        ),
      );
  }, [params.id]);

  if (error)
    return (
      <div
        role="alert"
        className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"
      >
        {error}
      </div>
    );
  if (!quotation || !company)
    return (
      <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading quotation…
      </div>
    );

  const logo = resolveMediaUrl(company.invoiceLogoUrl ?? company.logoUrl);
  const address = [
    company.addressLine1,
    company.addressLine2,
    company.city,
    company.country,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Return to Ledger
        </Link>
        <Button onClick={() => window.print()}>
          <Printer size={16} />
          Print / Save as PDF
        </Button>
      </div>
      <article className="mx-auto max-w-4xl bg-white p-8 shadow-sm print:max-w-none print:p-12 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-7">
          <div>
            {logo ? (
              <img
                src={logo}
                alt={`${company.name} logo`}
                className="mb-3 max-h-24 max-w-64 object-contain object-left"
              />
            ) : null}
            <h1 className="text-2xl font-bold text-slate-950">
              {company.legalName ?? company.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {address}
              {company.phone ? (
                <>
                  <br />
                  Contact: {company.phone}
                </>
              ) : null}
              {company.email ? (
                <>
                  <br />
                  Email: {company.email}
                </>
              ) : null}
              {company.taxNumber ? (
                <>
                  <br />
                  <strong>VAT / PAN NO:</strong> {company.taxNumber}
                </>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold tracking-wide text-blue-600">
              QUOTATION
            </h2>
            <p className="mt-5 text-xs font-semibold text-slate-500">
              ISSUE DATE
            </p>
            <p className="font-bold">{quotation.issueDate}</p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              QUOTATION NUMBER
            </p>
            <p className="text-lg font-extrabold">
              {quotation.quotationNumber}
            </p>
          </div>
        </header>
        <section className="grid gap-6 border-b border-slate-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-600">
              Client / Customer
            </p>
            <p className="mt-1 font-bold">{quotation.customerName}</p>
            <p className="text-sm text-slate-600">{quotation.customerCode}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-600">
              Quotation Valid Until
            </p>
            <p className="mt-1 font-bold">{quotation.expiryDate}</p>
            {quotation.destinationAddress ? (
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {quotation.destinationAddress}
              </p>
            ) : null}
          </div>
        </section>
        <h3 className="mt-7 text-lg font-bold">
          Itemized Cost Evaluation Breakdown
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase">
                <th className="border border-slate-300 p-3">
                  Product / Service
                </th>
                <th className="border border-slate-300 p-3">Description</th>
                <th className="border border-slate-300 p-3 text-right">Qty</th>
                <th className="border border-slate-300 p-3 text-right">
                  Rate (Rs.)
                </th>
                <th className="border border-slate-300 p-3 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 p-3 font-medium">
                    {item.itemName}
                  </td>
                  <td className="border border-slate-300 p-3 text-slate-600">
                    {item.description ?? "—"}
                  </td>
                  <td className="border border-slate-300 p-3 text-right">
                    {item.quantity}
                  </td>
                  <td className="border border-slate-300 p-3 text-right">
                    {money(item.unitPrice)}
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-semibold">
                    {money(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto mt-5 grid max-w-sm grid-cols-2 gap-y-2 text-sm">
          <dt>Items Subtotal</dt>
          <dd className="text-right font-semibold">
            {money(quotation.subtotalAmount)}
          </dd>
          <dt>VAT (13%)</dt>
          <dd className="text-right font-semibold">
            {money(quotation.vatAmount)}
          </dd>
          <dt className="border-t border-slate-300 pt-3 font-bold">
            Grand Total (Inc. VAT)
          </dt>
          <dd className="border-t border-slate-300 pt-3 text-right text-lg font-extrabold text-blue-600">
            {money(quotation.totalAmount)}
          </dd>
        </dl>
        {quotation.terms ? (
          <section className="mt-10">
            <h3 className="text-sm font-bold uppercase">
              Terms &amp; Conditions
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {quotation.terms}
            </p>
          </section>
        ) : null}
        <footer className="ml-auto mt-24 w-52 border-t border-slate-700 pt-2 text-center text-sm">
          <strong>Authorized Officer</strong>
          <br />
          <span className="text-xs text-slate-500">AUTHORIZED SIGNATORY</span>
        </footer>
      </article>
    </div>
  );
}
