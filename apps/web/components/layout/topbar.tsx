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

import { apiRequest } from "@/lib/api";
import {
  AUTH_USER_CHANGED_EVENT,
  clearAuthSession,
  getStoredUser,
} from "@/lib/auth";
import {
  buildMonthGrid,
  dayOfMonth,
  isSameDay,
  isSaturday,
  isWithinMonth,
  secondaryDayOfMonth,
  shiftMonth,
} from "@/lib/calendar-grid";
import { useCalendarSystem } from "@/lib/calendar-system";
import { AuthenticatedImage } from "@/components/media";
import {
  formatBsDate,
  formatCalendarDate,
  toDevanagariDigits,
  toIsoDate,
  type CalendarSystem,
} from "@/lib/nepali-date";
import { ROLE_LABELS } from "@/lib/user-roles";
import type { AuthUser } from "@/types/auth";
import { NotificationsDropdown } from "./notifications-dropdown";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  /*
   * The signed-in user lives in localStorage, which does not exist while the
   * shell is server rendered, so it is adopted after mount to keep the server
   * and client markup identical.
   */
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());

    function syncUser(): void {
      setUser(getStoredUser());
    }

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncUser);
    return () => window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncUser);
  }, []);

  const displayName = getDisplayName(user);

  const initials = getInitials(user);

  const { system, setSystem } = useCalendarSystem();

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

  async function handleLogout(): Promise<void> {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
        skipAuthRefresh: true,
      });
    } finally {
      clearAuthSession();

      router.replace("/login");
    }
  }

  function selectToday(): void {
    const today = new Date();

    setSelectedDate(today);

    setVisibleMonth(today);

    setCalendarOpen(false);
  }

  function selectDate(date: Date): void {
    setSelectedDate(date);

    setVisibleMonth(date);

    setCalendarOpen(false);
  }

  function previousMonth(): void {
    setVisibleMonth((current) => shiftMonth(current, system, -1));
  }

  function nextMonth(): void {
    setVisibleMonth((current) => shiftMonth(current, system, 1));
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
          {/* The greeting reads the viewer's clock, which the server cannot match. */}
          <p
            suppressHydrationWarning
            className="truncate text-sm font-semibold text-slate-900 sm:text-base"
          >
            {greeting}
            {displayName ? `, ${displayName}` : ""}
          </p>

          <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">
            Welcome back to your workspace
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <NotificationsDropdown />

        <div ref={calendarRef} className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen((current) => !current)}
            aria-expanded={calendarOpen}
            className={[
              "hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium shadow-[0_8px_18px_-10px_rgba(15,23,42,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(15,23,42,0.42)] sm:flex",
              calendarOpen
                ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100 shadow-[0_12px_24px_-10px_rgba(37,99,235,0.45)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            ].join(" ")}
          >
            <CalendarDays size={17} />

            <span>{formatCalendarDate(toIsoDate(selectedDate), system)}</span>

            {calendarOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setCalendarOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_24px_-10px_rgba(15,23,42,0.42)] sm:hidden"
            aria-label="Open calendar"
          >
            <CalendarDays size={18} />
          </button>

          {calendarOpen ? (
            <CalendarPopover
              system={system}
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              onPreviousMonth={previousMonth}
              onNextMonth={nextMonth}
              onSelectDate={selectDate}
              onToday={selectToday}
              onSystemChange={setSystem}
            />
          ) : null}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          onClick={() => router.push("/profile")}
          title="Open profile"
          className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-2 py-1 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_24px_-10px_rgba(15,23,42,0.42)]"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900 transition group-hover:text-blue-600">
              {displayName || "User"}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {user?.role ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>

          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700 ring-2 ring-white">
            {user?.avatarUrl ? (
              <AuthenticatedImage
                src={user.avatarUrl}
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
  system,
  visibleMonth,
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  onToday,
  onSystemChange,
}: {
  system: CalendarSystem;
  visibleMonth: Date;
  selectedDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
  onSystemChange: (next: CalendarSystem) => void;
}) {
  const grid = useMemo(
    () => buildMonthGrid(visibleMonth, system),
    [visibleMonth, system],
  );

  const today = new Date();

  return (
    <div className="absolute right-0 top-12 z-200 w-82.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold text-slate-500">
          {formatBsDate(today, { numerals: "np", withWeekday: true })}
        </p>

        <div
          role="group"
          aria-label="Calendar system"
          className="flex rounded-lg bg-slate-100 p-0.5"
        >
          {(["AD", "BS"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSystemChange(option)}
              aria-pressed={system === option}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                system === option
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          aria-label="Previous month"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <p className="font-semibold text-slate-900">{grid.title}</p>
          <p className="text-[11px] text-slate-400">{grid.subtitle}</p>
        </div>

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
          {grid.weekdays.map((weekday) => (
            <div
              key={weekday.index}
              className={[
                "py-2 text-[10px] font-bold uppercase tracking-wide",
                weekday.index === 6 ? "text-red-500" : "text-slate-400",
              ].join(" ")}
            >
              {weekday.short}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {grid.days.map((date) => {
            const inCurrentMonth = isWithinMonth(date, grid);

            const selected = isSameDay(date, selectedDate);

            const isToday = isSameDay(date, today);

            const primary = dayOfMonth(date, system);

            const secondary = secondaryDayOfMonth(date, system);

            return (
              <button
                key={toIsoDate(date)}
                type="button"
                onClick={() => onSelectDate(date)}
                className={[
                  "mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-lg leading-none transition",
                  selected
                    ? "bg-blue-600 font-semibold text-white shadow-sm"
                    : inCurrentMonth
                      ? "hover:bg-slate-100"
                      : "hover:bg-slate-50",
                  isToday && !selected ? "ring-1 ring-blue-300" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-sm",
                    selected
                      ? ""
                      : !inCurrentMonth
                        ? "text-slate-300"
                        : isToday
                          ? "font-semibold text-blue-600"
                          : isSaturday(date)
                            ? "text-red-600"
                            : "text-slate-800",
                  ].join(" ")}
                >
                  {system === "BS" ? toDevanagariDigits(primary) : primary}
                </span>

                <span
                  className={[
                    "mt-0.5 text-[9px]",
                    selected
                      ? "text-blue-100"
                      : inCurrentMonth
                        ? "text-slate-400"
                        : "text-slate-200",
                  ].join(" ")}
                >
                  {system === "BS" ? secondary : toDevanagariDigits(secondary)}
                </span>
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
