"use client";

import {
  Archive,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Smartphone,
  Star,
  UserRound,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { Button, ConfirmDialog, Spinner } from "@/components/ui";

import {
  archiveCustomerContact,
  getCustomerContacts,
  updateCustomerContact,
  updateCustomerContactStatus,
} from "@/lib/customer-contacts";

import type { CustomerContact } from "@/types/customer-contact";

import { CustomerContactModal } from "./customer-contact-modal";

interface CustomerContactsSectionProps {
  customerId: string;
}

export function CustomerContactsSection({
  customerId,
}: CustomerContactsSectionProps) {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingContact, setEditingContact] = useState<CustomerContact | null>(
    null,
  );

  const [menuContactId, setMenuContactId] = useState<string | null>(null);

  const [busyContactId, setBusyContactId] = useState<string | null>(null);

  const [contactPendingArchive, setContactPendingArchive] =
    useState<CustomerContact | null>(null);

  const loadContacts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCustomerContacts(customerId);

      setContacts(sortContacts(result));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load contacts.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function openCreate(): void {
    setEditingContact(null);
    setMenuContactId(null);
    setModalOpen(true);
  }

  function openEdit(contact: CustomerContact): void {
    setEditingContact(contact);
    setMenuContactId(null);
    setModalOpen(true);
  }

  function handleSaved(saved: CustomerContact): void {
    setContacts((current) => {
      const exists = current.some((contact) => contact.id === saved.id);

      const updated = exists
        ? current.map((contact) => {
            if (contact.id === saved.id) {
              return saved;
            }

            if (saved.isPrimary) {
              return {
                ...contact,
                isPrimary: false,
              };
            }

            return contact;
          })
        : [
            ...current.map((contact) =>
              saved.isPrimary
                ? {
                    ...contact,
                    isPrimary: false,
                  }
                : contact,
            ),
            saved,
          ];

      return sortContacts(updated);
    });

    setModalOpen(false);
    setEditingContact(null);
  }

  async function makePrimary(contact: CustomerContact): Promise<void> {
    if (contact.isPrimary) {
      setMenuContactId(null);
      return;
    }

    setBusyContactId(contact.id);

    setMenuContactId(null);
    setError(null);

    try {
      const updated = await updateCustomerContact(customerId, contact.id, {
        isPrimary: true,
      });

      setContacts((current) =>
        sortContacts(
          current.map((item) => ({
            ...item,
            isPrimary: item.id === updated.id,
          })),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to set primary contact.",
      );
    } finally {
      setBusyContactId(null);
    }
  }

  async function toggleStatus(contact: CustomerContact): Promise<void> {
    setBusyContactId(contact.id);

    setMenuContactId(null);
    setError(null);

    try {
      const updated = await updateCustomerContactStatus(
        customerId,
        contact.id,
        !contact.isActive,
      );

      setContacts((current) =>
        sortContacts(
          current.map((item) => (item.id === updated.id ? updated : item)),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update contact status.",
      );
    } finally {
      setBusyContactId(null);
    }
  }

  function requestArchive(contact: CustomerContact): void {
    setMenuContactId(null);
    setContactPendingArchive(contact);
  }

  async function confirmArchive(): Promise<void> {
    if (!contactPendingArchive) {
      return;
    }

    const contact = contactPendingArchive;

    setBusyContactId(contact.id);

    setError(null);

    try {
      await archiveCustomerContact(customerId, contact.id);

      setContacts((current) =>
        current.filter((item) => item.id !== contact.id),
      );

      setContactPendingArchive(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive contact.",
      );
    } finally {
      setBusyContactId(null);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Contacts</h2>

            {!loading ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {contacts.length}{" "}
                {contacts.length === 1 ? "contact" : "contacts"}
              </p>
            ) : null}
          </div>

          <Button onClick={openCreate}>
            <Plus size={16} />
            Add contact
          </Button>
        </div>

        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserRound size={20} />
            </div>

            <p className="mt-3 font-medium text-slate-800">No contacts yet</p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Add the people you communicate with at this customer.
            </p>

            <Button className="mt-4" onClick={openCreate}>
              <Plus size={16} />
              Add first contact
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contacts.map((contact) => {
              const busy = busyContactId === contact.id;

              return (
                <div
                  key={contact.id}
                  className={[
                    "relative flex gap-4 px-5 py-4",
                    !contact.isActive ? "bg-slate-50/70" : "",
                  ].join(" ")}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {getInitials(contact)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </p>

                      {contact.isPrimary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Star size={11} />
                          Primary
                        </span>
                      ) : null}

                      {!contact.isActive ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Inactive
                        </span>
                      ) : null}
                    </div>

                    {contact.jobTitle ? (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {contact.jobTitle}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600"
                        >
                          <Mail size={14} />

                          {contact.email}
                        </a>
                      ) : null}

                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600"
                        >
                          <Phone size={14} />

                          {contact.phone}
                        </a>
                      ) : null}

                      {contact.mobile ? (
                        <a
                          href={`tel:${contact.mobile}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600"
                        >
                          <Smartphone size={14} />

                          {contact.mobile}
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setMenuContactId((current) =>
                          current === contact.id ? null : contact.id,
                        )
                      }
                      aria-label={`Contact options for ${contact.firstName} ${contact.lastName}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                      ) : (
                        <MoreHorizontal size={18} />
                      )}
                    </button>

                    {menuContactId === contact.id ? (
                      <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEdit(contact)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        {!contact.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => void makePrimary(contact)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Star size={15} />
                            Make primary
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => void toggleStatus(contact)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {contact.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => requestArchive(contact)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Archive size={15} />
                          Archive
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CustomerContactModal
        open={modalOpen}
        customerId={customerId}
        contact={editingContact}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(contactPendingArchive)}
        title="Archive contact"
        description={
          contactPendingArchive
            ? `Archive ${contactPendingArchive.firstName} ${contactPendingArchive.lastName}? This contact will no longer appear in the customer's active contact list.`
            : ""
        }
        confirmLabel="Archive contact"
        destructive
        loading={
          contactPendingArchive
            ? busyContactId === contactPendingArchive.id
            : false
        }
        onClose={() => {
          if (busyContactId) {
            return;
          }

          setContactPendingArchive(null);
        }}
        onConfirm={() => void confirmArchive()}
      />
    </>
  );
}

function sortContacts(contacts: CustomerContact[]): CustomerContact[] {
  return [...contacts].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }

    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return `${a.firstName} ${a.lastName}`.localeCompare(
      `${b.firstName} ${b.lastName}`,
    );
  });
}

function getInitials(contact: CustomerContact): string {
  return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
}
