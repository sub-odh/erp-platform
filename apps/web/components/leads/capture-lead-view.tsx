"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button, Input, Modal, Select } from "@/components/ui";
import { getCustomers } from "@/lib/customers";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import type { Customer } from "@/types/customer";

const SOURCES = ["Website", "Referral", "Cold Call", "Social Media", "Direct Partner"];

export function CaptureLeadView({
  open,
  saving,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newClient, setNewClient] = useState(false);
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [stage, setStage] = useState("Discovery");
  const [source, setSource] = useState("Website");

  useEffect(() => {
    if (!open) return;
    getCustomers({ limit: 200, isActive: true })
      .then((page) => setCustomers(page.data))
      .catch(() => setCustomers([]));
  }, [open]);

  const matches = customers.filter((customer) =>
    customer.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({
      customerId: newClient ? undefined : customerId || undefined,
      companyName: newClient ? undefined : companyName || undefined,
      newCompanyName: newClient ? newCompanyName : undefined,
      clientAddress: newClient ? address : undefined,
      clientTaxNumber: newClient ? taxNumber : undefined,
      projectTitle,
      contactPerson,
      phone,
      email: email || undefined,
      dealValue: Number(dealValue) || 0,
      stage,
      source,
    });
  }

  return (
    <Modal
      open={open}
      title="Capture New Opportunity"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="capture-lead" loading={saving}>Save Lead Opportunity</Button>
        </>
      }
    >
      <form id="capture-lead" className="space-y-3" onSubmit={submit}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            {newClient ? "New Company Name" : "Select Registered Client"}
          </p>
          <button
            type="button"
            className="rounded-full border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
            onClick={() => setNewClient((current) => !current)}
          >
            {newClient ? "Select Existing" : "New Client"}
          </button>
        </div>
        {newClient ? (
          <>
            <Input value={newCompanyName} placeholder="Enter New Company Name" onChange={(event) => setNewCompanyName(event.target.value)} required />
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-blue-700">New Client Metadata Profile</p>
              <Input label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
              <div className="mt-2">
                <Input label="Tax / PAN Number" value={taxNumber} onChange={(event) => setTaxNumber(event.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <div className="relative">
            <Input
              value={query}
              placeholder="Type to search existing client..."
              autoComplete="off"
              onFocus={() => setOpenList(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenList(true);
              }}
            />
            {openList ? (
              <ul className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-200 bg-white shadow">
                {matches.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setCustomerId(customer.id);
                        setCompanyName(customer.name);
                        setQuery(customer.name);
                        setContactPerson(customer.contactPerson ?? "");
                        setPhone(customer.phone ?? "");
                        setEmail(customer.email ?? "");
                        setOpenList(false);
                      }}
                    >
                      {customer.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
        <Input label="Project / Requirement Item" value={projectTitle} placeholder="e.g., Enterprise Software License, Server Infrastructure Upgrade" onChange={(event) => setProjectTitle(event.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Contact Person" value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} />
          <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Estimated Deal Value (Rs.)" type="number" step="0.01" value={dealValue} placeholder="0.00" onChange={(event) => setDealValue(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select label="Pipeline Stage" value={stage} onChange={(event) => setStage(event.target.value)}>
            {PIPELINE_STAGES.map((item) => (
              <option key={item.name} value={item.name}>{item.name} ({item.percent}%)</option>
            ))}
          </Select>
          <Select label="Lead Source" value={source} onChange={(event) => setSource(event.target.value)}>
            {SOURCES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </Modal>
  );
}
