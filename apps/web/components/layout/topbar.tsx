"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LogOut,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { clearAuthSession, getStoredUser } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/organizations";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  const user = getStoredUser();

  const displayName = getDisplayName(user);

  const initials = getInitials(user);

  const avatarUrl = resolveMediaUrl(user?.avatarUrl);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const calendarRef = useRef<HTMLDivElement>(null);

  const greeting = getGreeting();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout(): void {
    clearAuthSession();

    router.replace("/login");
  }

  function selectToday(): void {
    const today = new Date();

    setSelectedDate(today);

    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));

    setCalendarOpen(false);
  }

  function selectDate(date: Date): void {
    setSelectedDate(date);

    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));

    setCalendarOpen(false);
  }

  function previousMonth(): void {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function nextMonth(): void {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {greeting}
            {displayName ? `, ${displayName}` : ""}
          </p>

          <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">
            Welcome back to your workspace
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div ref={calendarRef} className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen((current) => !current)}
            aria-expanded={calendarOpen}
            className={[
              "hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition sm:flex",
              calendarOpen
                ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            ].join(" ")}
          >
            <CalendarDays size={17} />

            <span>{formatTopbarDate(selectedDate)}</span>

            {calendarOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setCalendarOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:hidden"
            aria-label="Open calendar"
          >
            <CalendarDays size={18} />
          </button>

          {calendarOpen ? (
            <CalendarPopover
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              onPreviousMonth={previousMonth}
              onNextMonth={nextMonth}
              onSelectDate={selectDate}
              onToday={selectToday}
            />
          ) : null}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          onClick={() => router.push("/profile")}
          title="Open profile"
          className="group flex items-center gap-3 rounded-xl px-1.5 py-1 transition hover:bg-slate-50"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900 transition group-hover:text-blue-600">
              {displayName || "User"}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {user?.role ?? ""}
            </p>
          </div>

          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700 ring-2 ring-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}

            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}

function CalendarPopover({
  visibleMonth,
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  onToday,
}: {
  visibleMonth: Date;
  selectedDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
}) {
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const today = new Date();

  return (
    <div className="absolute right-0 top-12 z-[200] w-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          aria-label="Previous month"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft size={18} />
        </button>

        <p className="font-semibold text-slate-900">
          {new Intl.DateTimeFormat(undefined, {
            month: "long",
            year: "numeric",
          }).format(visibleMonth)}
        </p>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-7 text-center">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date) => {
            const inCurrentMonth = date.getMonth() === visibleMonth.getMonth();

            const selected = isSameDay(date, selectedDate);

            const isToday = isSameDay(date, today);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                  selected
                    ? "bg-blue-600 font-semibold text-white shadow-sm"
                    : inCurrentMonth
                      ? "text-slate-800 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50",
                  isToday && !selected
                    ? "font-semibold text-blue-600 ring-1 ring-blue-200"
                    : "",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onToday}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          <CalendarDays size={16} />
          Today
        </button>
      </div>
    </div>
  );
}

function buildCalendarDays(month: Date): Date[] {
  const year = month.getFullYear();

  const monthIndex = month.getMonth();

  const first = new Date(year, monthIndex, 1);

  /*
   * JS:
   * Sunday = 0
   *
   * Our calendar:
   * Monday = first column
   */
  const mondayOffset = (first.getDay() + 6) % 7;

  const start = new Date(year, monthIndex, 1 - mondayOffset);

  return Array.from(
    {
      length: 42,
    },
    (_, index) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatTopbarDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getDisplayName(user: ReturnType<typeof getStoredUser>): string {
  if (!user) {
    return "";
  }

  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

function getInitials(user: ReturnType<typeof getStoredUser>): string {
  if (!user) {
    return "U";
  }

  const result =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return result || "U";
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}
