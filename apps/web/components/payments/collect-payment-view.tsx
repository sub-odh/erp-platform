"use client";

import { FormEvent, useState } from "react";

import { Button, Input, Modal, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";

export function CollectPaymentView({
  open,
  deliveryNumber,
  balance,
  saving,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  deliveryNumber: string;
  balance: number;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: { amount: number; method: string; reference?: string; paymentDate: string }) => void;
}) {
  const [paymentDate, setPaymentDate] = useState(today());
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({
      amount: Number(amount),
      method,
      reference: reference || undefined,
      paymentDate,
    });
  }

  return (
    <Modal
      open={open}
      title="Record Payment"
      onClose={onClose}
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="collect-payment" loading={saving}>Post Payment</Button>
        </>
      }
    >
      <form id="collect-payment" className="space-y-3" onSubmit={submit}>
        <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">DO Number</p>
            <p className="font-semibold">#{deliveryNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400">Max Balance</p>
            <p className="font-semibold text-rose-600">{formatCurrency(balance)}</p>
          </div>
        </div>
        <Input label="Payment Date" type="date" value={paymentDate} required onChange={(event) => setPaymentDate(event.target.value)} />
        <Input label="Payment Amount (Rs.)" type="number" step="0.01" min="0.01" value={amount} required onChange={(event) => setAmount(event.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Select label="Method" value={method} required onChange={(event) => setMethod(event.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Online Transfer">Online Transfer</option>
          </Select>
          <Input label="Ref / Cheque No." value={reference} placeholder="Optional" onChange={(event) => setReference(event.target.value)} />
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </Modal>
  );
}

function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
