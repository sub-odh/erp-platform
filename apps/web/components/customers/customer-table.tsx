"use client";

import {
  ArrowUpDown,
  ChevronRight,
  Mail,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import type {
  Customer,
  CustomerSortField,
  SortDirection,
} from "@/types/customer";

interface CustomerTableProps {
  customers: Customer[];
  busyCustomerId: string | null;

  sortBy: CustomerSortField;
  sortDirection: SortDirection;

  onSort: (field: CustomerSortField) => void;

  onOpen: (customer: Customer) => void;

  onToggleStatus: (customer: Customer) => void;
}

interface MenuPosition {
  top: number;
  right: number;
}

export function CustomerTable({
  customers,
  busyCustomerId,
  sortBy,
  sortDirection,
  onSort,
  onOpen,
  onToggleStatus,
}: CustomerTableProps) {
  const [openMenuCustomer, setOpenMenuCustomer] = useState<Customer | null>(
    null,
  );

  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuCustomer) {
      return;
    }

    function closeMenu(): void {
      setOpenMenuCustomer(null);
      setMenuPosition(null);
    }

    function handleMouseDown(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("resize", closeMenu);

    window.addEventListener("scroll", closeMenu, true);

    document.addEventListener("mousedown", handleMouseDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", closeMenu);

      window.removeEventListener("scroll", closeMenu, true);

      document.removeEventListener("mousedown", handleMouseDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuCustomer]);

  function toggleMenu(customer: Customer, button: HTMLButtonElement): void {
    if (openMenuCustomer?.id === customer.id) {
      setOpenMenuCustomer(null);
      setMenuPosition(null);

      return;
    }

    const rect = button.getBoundingClientRect();

    const menuWidth = 192;
    const margin = 12;

    const right = Math.max(margin, window.innerWidth - rect.right);

    setMenuPosition({
      top: rect.bottom + 8,
      right,
    });

    setOpenMenuCustomer(customer);
  }

  function closeMenu(): void {
    setOpenMenuCustomer(null);
    setMenuPosition(null);
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="font-medium text-slate-700">No customers found</p>

        <p className="mt-2 text-sm text-slate-500">
          Try changing your search or filters, or create a new customer.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <SortableHeader
                  label="Customer"
                  field="name"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />

                <SortableHeader
                  label="Code"
                  field="customerCode"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />

                <TableHeader>Contact</TableHeader>

                <TableHeader>Terms</TableHeader>

                <TableHeader>Status</TableHeader>

                <TableHeader align="right">Actions</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => {
                const busy = busyCustomerId === customer.id;

                return (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onOpen(customer)}
                        className="group text-left"
                      >
                        <p className="font-medium text-slate-900 transition group-hover:text-blue-600">
                          {customer.name}
                        </p>

                        {customer.legalName ? (
                          <p className="mt-1 max-w-72 truncate text-xs text-slate-500">
                            {customer.legalName}
                          </p>
                        ) : null}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700">
                        {customer.customerCode}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {customer.email ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail
                              size={14}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="max-w-56 truncate">
                              {customer.email}
                            </span>
                          </div>
                        ) : null}

                        {customer.phone ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone
                              size={14}
                              className="shrink-0 text-slate-400"
                            />

                            {customer.phone}
                          </div>
                        ) : null}

                        {!customer.email && !customer.phone ? (
                          <span className="text-sm text-slate-400">—</span>
                        ) : null}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {customer.paymentTermsDays === 0
                        ? "Due immediately"
                        : `${customer.paymentTermsDays} days`}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <CustomerStatusBadge isActive={customer.isActive} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpen(customer)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Open ${customer.name}`}
                        >
                          <ChevronRight size={18} />
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={(event) =>
                            toggleMenu(customer, event.currentTarget)
                          }
                          className={[
                            "rounded-lg p-2 transition disabled:opacity-50",
                            openMenuCustomer?.id === customer.id
                              ? "bg-slate-100 text-slate-700"
                              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
                          ].join(" ")}
                          aria-label={`Actions for ${customer.name}`}
                          aria-expanded={openMenuCustomer?.id === customer.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openMenuCustomer && menuPosition ? (
        <div
          ref={menuRef}
          className="fixed z-[100] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
          style={{
            top: menuPosition.top,
            right: menuPosition.right,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const customer = openMenuCustomer;

              closeMenu();

              onOpen(customer);
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            View details
          </button>

          <button
            type="button"
            disabled={busyCustomerId === openMenuCustomer.id}
            onClick={() => {
              const customer = openMenuCustomer;

              closeMenu();

              onToggleStatus(customer);
            }}
            className={[
              "block w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 disabled:opacity-50",
              openMenuCustomer.isActive ? "text-red-600" : "text-emerald-700",
            ].join(" ")}
          >
            {openMenuCustomer.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;

  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortDirection,
  onSort,
}: {
  label: string;

  field: CustomerSortField;

  sortBy: CustomerSortField;

  sortDirection: SortDirection;

  onSort: (field: CustomerSortField) => void;
}) {
  const active = sortBy === field;

  return (
    <th className="px-5 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={[
          "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition",
          active ? "text-slate-800" : "text-slate-500 hover:text-slate-700",
        ].join(" ")}
      >
        {label}

        <ArrowUpDown size={13} />

        {active ? (
          <span className="sr-only">
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </span>
        ) : null}
      </button>
    </th>
  );
}
