"use client";

import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  Spinner,
} from "@/components/ui";
import { canManageHalls } from "@/lib/hr-access";
import { createHall, deleteHall, getHalls, updateHall } from "@/lib/halls";
import type { HallArrangement, HallInput, HallStatus, MeetingHall } from "@/types/hall";

const ARRANGEMENTS: { value: HallArrangement; label: string }[] = [
  { value: "BOARDROOM", label: "Boardroom" },
  { value: "THEATER", label: "Theater" },
  { value: "U_SHAPE", label: "U-Shape" },
  { value: "CLASSROOM", label: "Classroom" },
];

export default function HallsPage() {
  const [manage, setManage] = useState(false);
  const [halls, setHalls] = useState<MeetingHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<MeetingHall | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingHall | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setManage(canManageHalls());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setHalls(await getHalls());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load meeting halls.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setSelected(null);
    setFormOpen(true);
  }

  function openEdit(hall: MeetingHall) {
    setSelected(hall);
    setFormOpen(true);
  }

  async function handleSubmit(payload: HallInput) {
    setSubmitting(true);
    setError(null);

    try {
      if (selected) {
        await updateHall(selected.id, payload);
      } else {
        await createHall(payload);
      }
      setFormOpen(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the meeting hall.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deleteHall(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the meeting hall.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Meeting Hall Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Maintain hall capacity, arrangement, and availability.
            </p>
          </div>
        </div>

        {manage ? (
          <Button onClick={openCreate}>
            <Plus size={17} />
            Add Hall
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && halls.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : halls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No meeting halls have been added yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {halls.map((hall) => (
            <Card key={hall.id}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {hall.hallName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {hall.location || "Location not set"}
                    </p>
                  </div>
                  <Badge variant={hall.status === "ACTIVE" ? "success" : "warning"}>
                    {hall.status === "ACTIVE" ? "Active" : "Maintenance"}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Capacity
                    </dt>
                    <dd className="mt-1 text-slate-800">{hall.capacity ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Arrangement
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {ARRANGEMENTS.find((item) => item.value === hall.arrangementType)
                        ?.label ?? hall.arrangementType}
                    </dd>
                  </div>
                </dl>
                {manage ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(hall)}>
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(hall)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HallFormModal
        open={formOpen}
        hall={selected}
        loading={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Meeting Hall"
        description="This hall and its bookings will be removed from the company."
        confirmLabel="Delete Hall"
        destructive
        loading={submitting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function HallFormModal({
  open,
  hall,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  hall: MeetingHall | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: HallInput) => void;
}) {
  const [hallName, setHallName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [arrangementType, setArrangementType] =
    useState<HallArrangement>("BOARDROOM");
  const [status, setStatus] = useState<HallStatus>("ACTIVE");

  useEffect(() => {
    setHallName(hall?.hallName ?? "");
    setLocation(hall?.location ?? "");
    setCapacity(hall?.capacity ? String(hall.capacity) : "");
    setArrangementType(hall?.arrangementType ?? "BOARDROOM");
    setStatus(hall?.status ?? "ACTIVE");
  }, [hall, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      hallName: hallName.trim(),
      location: location.trim() || null,
      capacity: capacity ? Number(capacity) : null,
      arrangementType,
      status,
    });
  }

  return (
    <Modal
      open={open}
      title={hall ? "Edit Meeting Hall" : "Add Meeting Hall"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="hall-form" loading={loading}>
            Save Hall
          </Button>
        </>
      }
    >
      <form id="hall-form" className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Name"
          required
          value={hallName}
          onChange={(event) => setHallName(event.target.value)}
        />
        <Input
          label="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <Input
          label="Capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />
        <Select
          label="Arrangement"
          value={arrangementType}
          onChange={(event) =>
            setArrangementType(event.target.value as HallArrangement)
          }
        >
          {ARRANGEMENTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as HallStatus)}
        >
          <option value="ACTIVE">Active</option>
          <option value="MAINTENANCE">Maintenance</option>
        </Select>
      </form>
    </Modal>
  );
}
