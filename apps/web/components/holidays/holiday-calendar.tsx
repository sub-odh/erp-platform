"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

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
import { cn } from "@/lib/cn";
import {
  formatCalendarDate,
  toDevanagariDigits,
  toIsoDate,
  type CalendarSystem,
} from "@/lib/nepali-date";
import type { Holiday } from "@/types/holiday";

const SATURDAY_INDEX = 6;

interface HoverCard {
  holiday: Holiday;
  top: number;
  left: number;
}

interface HolidayCalendarProps {
  holidays: Holiday[];
  onSelectDate?: (isoDate: string, holiday?: Holiday) => void;
  onSelectHoliday?: (holiday: Holiday) => void;
  onMonthChange?: (anchor: Date) => void;
}

export function HolidayCalendar({
  holidays,
  onSelectDate,
  onSelectHoliday,
  onMonthChange,
}: HolidayCalendarProps) {
  const { system } = useCalendarSystem();
  const [anchor, setAnchor] = useState(() => new Date());
  const [hovered, setHovered] = useState<HoverCard | null>(null);
  const grid = useMemo(() => buildMonthGrid(anchor, system), [anchor, system]);
  const today = new Date();

  const byDate = useMemo(() => {
    const map = new Map<string, Holiday>();

    for (const holiday of holidays) {
      map.set(holiday.holidayDate, holiday);
    }

    return map;
  }, [holidays]);

  function shift(delta: number): void {
    setHovered(null);
    setAnchor((current) => {
      const next = shiftMonth(current, system, delta);
      onMonthChange?.(next);
      return next;
    });
  }

  function goToday(): void {
    const next = new Date();
    setHovered(null);
    setAnchor(next);
    onMonthChange?.(next);
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Today
          </button>
          <p className="ml-2 text-sm font-bold text-slate-900">
            {grid.title}
            <span className="ml-1.5 text-xs font-medium text-slate-400">
              | {grid.subtitle}
            </span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {grid.weekdays.map((weekday) => (
            <div
              key={weekday.index}
              className={cn(
                "px-2 py-2 text-center",
                weekday.index === SATURDAY_INDEX && "bg-red-50",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  weekday.index === SATURDAY_INDEX
                    ? "text-red-600"
                    : "text-slate-500",
                )}
              >
                {weekday.short}
              </p>
              {system === "BS" ? (
                <p
                  className={cn(
                    "text-[9px] leading-tight",
                    weekday.index === SATURDAY_INDEX
                      ? "text-red-400"
                      : "text-slate-400",
                  )}
                >
                  {weekday.np}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6">
          {grid.days.map((date) => {
            const iso = toIsoDate(date);
            const holiday = byDate.get(iso);

            return (
              <DayCell
                key={iso}
                date={date}
                isoDate={iso}
                system={system}
                muted={!isWithinMonth(date, grid)}
                isToday={isSameDay(date, today)}
                holiday={holiday}
                interactive={Boolean(onSelectDate)}
                onSelectDate={onSelectDate}
                onSelectHoliday={onSelectHoliday}
                onHover={setHovered}
              />
            );
          })}
        </div>
      </div>

      {hovered ? <HolidayHoverCard card={hovered} system={system} /> : null}
    </div>
  );
}

function DayCell({
  date,
  isoDate,
  system,
  muted,
  isToday,
  holiday,
  interactive,
  onSelectDate,
  onSelectHoliday,
  onHover,
}: {
  date: Date;
  isoDate: string;
  system: CalendarSystem;
  muted: boolean;
  isToday: boolean;
  holiday?: Holiday;
  interactive: boolean;
  onSelectDate?: (isoDate: string, holiday?: Holiday) => void;
  onSelectHoliday?: (holiday: Holiday) => void;
  onHover: (card: HoverCard | null) => void;
}) {
  const saturday = isSaturday(date);
  const primary = dayOfMonth(date, system);
  const secondary = secondaryDayOfMonth(date, system);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive ? () => onSelectDate?.(isoDate, holiday) : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectDate?.(isoDate, holiday);
              }
            }
          : undefined
      }
      className={cn(
        "flex min-h-[4.5rem] flex-col gap-0.5 overflow-hidden border-b border-r border-slate-200 p-1.5",
        muted ? "bg-slate-50/60" : saturday ? "bg-red-50/50" : "bg-white",
        isToday && "bg-indigo-50/80",
        interactive && "cursor-pointer transition hover:bg-slate-50",
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-1">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold leading-none",
            muted
              ? "text-slate-300"
              : isToday
                ? "bg-slate-900 text-white"
                : saturday
                  ? "text-red-600"
                  : "text-slate-700",
          )}
        >
          {system === "BS" ? toDevanagariDigits(primary) : primary}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] font-semibold leading-4",
            muted ? "text-slate-300" : "bg-slate-100 text-slate-500",
          )}
        >
          {system === "BS" ? secondary : toDevanagariDigits(secondary)}
        </span>
      </div>

      {holiday ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectHoliday?.(holiday);
          }}
          onMouseEnter={(event) =>
            onHover(buildHoverCard(holiday, event.currentTarget))
          }
          onMouseLeave={() => onHover(null)}
          className="truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold text-white"
          style={{ backgroundColor: "#e53e3e" }}
        >
          {holiday.title}
        </button>
      ) : null}
    </div>
  );
}

function HolidayHoverCard({
  card,
  system,
}: {
  card: HoverCard;
  system: CalendarSystem;
}) {
  return (
    <div
      role="tooltip"
      style={{ top: card.top, left: card.left }}
      className="pointer-events-none fixed z-50 w-52 -translate-y-2 rounded-xl bg-slate-900 p-3 text-white shadow-xl"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-300">
        {formatCalendarDate(card.holiday.holidayDate, system)}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{card.holiday.title}</p>
      <p className="mt-1 line-clamp-3 text-xs text-slate-300">
        {card.holiday.description || "No description."}
      </p>
    </div>
  );
}

function buildHoverCard(holiday: Holiday, element: HTMLElement): HoverCard {
  const rect = element.getBoundingClientRect();

  return {
    holiday,
    top: rect.bottom + 8,
    left: Math.min(Math.max(rect.left, 16), window.innerWidth - 230),
  };
}

export function holidaysInMonth(
  holidays: Holiday[],
  anchor: Date,
  system: CalendarSystem,
): Holiday[] {
  const grid = buildMonthGrid(anchor, system);
  const start = toIsoDate(grid.start);
  const end = toIsoDate(grid.end);

  return holidays.filter(
    (holiday) => holiday.holidayDate >= start && holiday.holidayDate <= end,
  );
}
