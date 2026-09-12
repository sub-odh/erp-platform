"use client";

import { Building2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { canManageHalls } from "@/lib/hr-access";
import {
  cancelHallBooking,
  confirmHallBooking,
  createHallBooking,
  getHallBookings,
  getHalls,
  getMyHallBookings,
} from "@/lib/halls";
import { toIsoDate } from "@/lib/nepali-date";
import type { HallBooking, HallBookingStatus, MeetingHall } from "@/types/hall";

const STATUS_VARIANT: Record<HallBookingStatus, "warning" | "success" | "default"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "default",
};

export default function HallBookingsPage() {
  const [manage, setManage] = useState(false);
  const [halls, setHalls] = useState<MeetingHall[]>([]);
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [hallId, setHallId] = useState("");
  const [bookingDate, setBookingDate] = useState(toIsoDate(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    setManage(canManageHalls());
    setAccessReady(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [hallRows, bookingRows] = await Promise.all([
        getHalls(),
        manage ? getHallBookings() : getMyHallBookings(),
      ]);
      setHalls(hallRows.filter((hall) => hall.status === "ACTIVE"));
      setBookings(bookingRows);
      setHallId((current) => current || hallRows[0]?.id || "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load hall bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, [manage]);

  useEffect(() => {
    if (!accessReady) {
      return;
    }

    void load();
  }, [accessReady, load]);

  const upcoming = useMemo(() => {
    const today = toIsoDate(new Date());
    return bookings
      .filter(
        (booking) =>
          booking.bookingDate >= today && booking.status !== "CANCELLED",
      )
      .sort((a, b) =>
        `${a.bookingDate}${a.startTime}`.localeCompare(
          `${b.bookingDate}${b.startTime}`,
        ),
      );
  }, [bookings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createHallBooking({
        hallId,
        bookingDate,
        startTime,
        endTime,
        reason: reason.trim() || null,
      });
      setReason("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to book the meeting hall.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(bookingId: string) {
    setError(null);
    try {
      await confirmHallBooking(bookingId);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to confirm this booking.",
      );
    }
  }

  async function handleCancel(bookingId: string) {
    setError(null);
    try {
      await cancelHallBooking(bookingId);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this booking.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Building2 size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Book Meeting Hall
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Reserve a hall and review upcoming bookings.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader title="New Booking" description="Overlapping confirmed or pending slots are rejected." />
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Select
              label="Meeting Hall"
              required
              value={hallId}
              onChange={(event) => setHallId(event.target.value)}
            >
              <option value="">Select Hall</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.hallName}
                  {hall.location ? ` — ${hall.location}` : ""}
                </option>
              ))}
            </Select>
            <Input
              label="Booking Date"
              type="date"
              required
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
            />
            <Input
              label="Start Time"
              type="time"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why is this hall needed?"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" loading={submitting}>
                Book Hall
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && bookings.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <Card>
          <CardHeader
            title={manage ? "Upcoming Bookings" : "My Upcoming Bookings"}
          />
          <CardContent className="p-0">
            {upcoming.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-slate-500">
                No upcoming bookings.
              </p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hall
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Booked By
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcoming.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {booking.hallName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {booking.bookingDate}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {booking.employeeName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[booking.status]}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {manage && booking.status === "PENDING" ? (
                            <Button
                              size="sm"
                              onClick={() => void handleConfirm(booking.id)}
                            >
                              Confirm
                            </Button>
                          ) : null}
                          {booking.status !== "CANCELLED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleCancel(booking.id)}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTime(value: string) {
  return value.slice(0, 5);
}
