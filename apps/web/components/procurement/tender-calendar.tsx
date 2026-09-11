"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildMonthGrid,
  dayOfMonth,
  isSameDay,
  isSaturday,
  isWithinMonth,
  secondaryDayOfMonth,
  shiftMonth,
  weekStartsOn,
} from "@/lib/calendar-grid";
import { useCalendarSystem } from "@/lib/calendar-system";
import { cn } from "@/lib/cn";
import {
  formatCalendarDate,
  toDevanagariDigits,
  toIsoDate,
  type CalendarSystem,
} from "@/lib/nepali-date";
import type { Tender, TenderUrgency } from "@/types/procurement";

export type TenderCalendarView = "month" | "week" | "list";

/* Saturday is the Nepali weekend, so that column is tinted red like a printed patro. */
const SATURDAY_INDEX = 6;

/* Card padding plus the page gutter that sit between the grid and the footer. */
const VIEWPORT_GUTTER = 56;

const VIEW_LABELS: Record<TenderCalendarView, string> = {
  month: "Month",
  week: "Week",
  list: "List",
};

export const URGENCY_STYLES: Record<
  TenderUrgency,
  { chip: string; badge: string; label: string }
> = {
  OVERDUE: {
    chip: "bg-red-100 text-red-700 hover:bg-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Overdue",
  },
  DUE_SOON: {
    chip: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    badge: "bg-amber-100 text-amber-800",
    label: "Due Soon",
  },
  UPCOMING: {
    chip: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    badge: "bg-blue-100 text-blue-700",
    label: "Upcoming",
  },
};

const ENDED_STYLE = {
  chip: "bg-slate-100 text-slate-400 line-through hover:bg-slate-200",
  badge: "bg-slate-100 text-slate-500",
  label: "Ended",
};

function tenderStyle(tender: Tender) {
  return tender.ended ? ENDED_STYLE : URGENCY_STYLES[tender.urgency];
}

interface HoverCard {
  tender: Tender;
  top: number;
  left: number;
}

interface TenderCalendarProps {
  tenders: Tender[];
  /* Omitted on the read-only calendar, where days are not clickable. */
  onSelectDate?: (isoDate: string) => void;
  onSelectTender?: (tender: Tender) => void;
}

export function TenderCalendar({
  tenders,
  onSelectDate,
  onSelectTender,
}: TenderCalendarProps) {
  /* Follows the AD/BS choice made in the topbar calendar. */
  const { system } = useCalendarSystem();

  const [view, setView] = useState<TenderCalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [hovered, setHovered] = useState<HoverCard | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridHeight, setGridHeight] = useState<number>();

  const grid = useMemo(() => buildMonthGrid(anchor, system), [anchor, system]);

  const byDate = useMemo(() => {
    const map = new Map<string, Tender[]>();

    for (const tender of tenders) {
      const existing = map.get(tender.submissionDate);

      if (existing) {
        existing.push(tender);
      } else {
        map.set(tender.submissionDate, [tender]);
      }
    }

    return map;
  }, [tenders]);

  const today = new Date();

  /*
   * Size the grid to whatever space is left below it so a whole month fits on
   * screen instead of running off the bottom of the page.
   */
  useEffect(() => {
    if (view === "list") {
      setGridHeight(undefined);
      return;
    }

    function measure(): void {
      const node = gridRef.current;

      if (!node) {
        return;
      }

      const distanceFromDocumentTop =
        node.getBoundingClientRect().top + window.scrollY;

      const footerHeight =
        document
          .querySelector("[data-app-footer]")
          ?.getBoundingClientRect().height ?? 0;

      const available =
        window.innerHeight -
        distanceFromDocumentTop -
        footerHeight -
        VIEWPORT_GUTTER;

      setGridHeight(Math.max(view === "week" ? 240 : 320, available));
    }

    measure();

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [view, system]);

  const weekDays = useMemo(() => {
    const offset = (anchor.getDay() - weekStartsOn(system) + 7) % 7;
    const start = new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate() - offset,
    );

    return Array.from(
      { length: 7 },
      (_, index) =>
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
    );
  }, [anchor, system]);

  function shift(delta: number): void {
    setHovered(null);
    setAnchor((current) =>
      view === "week"
        ? new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() + delta * 7,
          )
        : shiftMonth(current, system, delta),
    );
  }

  const cells = view === "week" ? weekDays : grid.days;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous period"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next period"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setAnchor(new Date())}
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

        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {(Object.keys(VIEW_LABELS) as TenderCalendarView[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition",
                view === option
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {VIEW_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <TenderList
          tenders={tenders}
          system={system}
          onSelectTender={onSelectTender}
        />
      ) : (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200">
          <div className="grid shrink-0 grid-cols-7 border-b border-slate-200 bg-slate-50">
            {grid.weekdays.map((weekday) => (
              <div
                key={weekday.index}
                className={cn(
                  "px-2 py-1 text-center",
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

          <div
            ref={gridRef}
            style={gridHeight ? { height: gridHeight } : undefined}
            className={cn(
              "grid grid-cols-7",
              view === "week" ? "grid-rows-1" : "grid-rows-6",
            )}
          >
            {cells.map((date) => {
              const iso = toIsoDate(date);

              return (
                <DayCell
                  key={iso}
                  date={date}
                  isoDate={iso}
                  system={system}
                  muted={view === "month" && !isWithinMonth(date, grid)}
                  isToday={isSameDay(date, today)}
                  tenders={byDate.get(iso) ?? []}
                  onSelectDate={onSelectDate}
                  onSelectTender={onSelectTender}
                  onHover={setHovered}
                />
              );
            })}
          </div>
        </div>
      )}

      {hovered ? <TenderHoverCard card={hovered} system={system} /> : null}
    </div>
  );
}

function DayCell({
  date,
  isoDate,
  system,
  muted,
  isToday,
  tenders,
  onSelectDate,
  onSelectTender,
  onHover,
}: {
  date: Date;
  isoDate: string;
  system: CalendarSystem;
  muted: boolean;
  isToday: boolean;
  tenders: Tender[];
  onSelectDate?: (isoDate: string) => void;
  onSelectTender?: (tender: Tender) => void;
  onHover: (card: HoverCard | null) => void;
}) {
  const interactive = Boolean(onSelectDate);
  const saturday = isSaturday(date);

  /*
   * Nepali Patro shows both calendars in every cell: the active one large and
   * the other as a small badge, so a date can be read either way at a glance.
   */
  const primary = dayOfMonth(date, system);
  const secondary = secondaryDayOfMonth(date, system);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onSelectDate?.(isoDate) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectDate?.(isoDate);
              }
            }
          : undefined
      }
      className={cn(
        "flex min-h-0 flex-col gap-0.5 overflow-hidden border-b border-r border-slate-200 p-1",
        muted ? "bg-slate-50/60" : saturday ? "bg-red-50/40" : "bg-white",
        isToday && "bg-blue-50",
        interactive && "cursor-pointer transition hover:bg-blue-50/70",
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-1">
        <span
          className={cn(
            "text-base font-bold leading-none",
            muted
              ? "text-slate-300"
              : isToday
                ? "text-blue-700"
                : saturday
                  ? "text-red-600"
                  : "text-slate-800",
          )}
        >
          {system === "BS" ? toDevanagariDigits(primary) : primary}
        </span>

        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] font-semibold leading-4",
            muted
              ? "text-slate-300"
              : isToday
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500",
          )}
        >
          {system === "BS" ? secondary : toDevanagariDigits(secondary)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {tenders.map((tender) => (
          <button
            key={tender.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectTender?.(tender);
            }}
            onMouseEnter={(event) =>
              onHover(buildHoverCard(tender, event.currentTarget))
            }
            onMouseLeave={() => onHover(null)}
            onFocus={(event) =>
              onHover(buildHoverCard(tender, event.currentTarget))
            }
            onBlur={() => onHover(null)}
            className={cn(
              "shrink-0 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition",
              tenderStyle(tender).chip,
            )}
          >
            {tender.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Mirrors the legacy read-only calendar, which popped the details above the event. */
function TenderHoverCard({
  card,
  system,
}: {
  card: HoverCard;
  system: CalendarSystem;
}) {
  const style = tenderStyle(card.tender);

  return (
    <div
      role="tooltip"
      style={{ top: card.top, left: card.left }}
      className="pointer-events-none fixed z-50 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
    >
      <p className="text-sm font-bold text-slate-900">{card.tender.title}</p>

      <p className="mt-1 text-xs text-slate-500">
        Submission {formatCalendarDate(card.tender.submissionDate, system)}
        {card.tender.closingDate
          ? ` · Closes ${formatCalendarDate(card.tender.closingDate, system)}`
          : ""}
      </p>

      {card.tender.details ? (
        <p className="mt-2 line-clamp-4 text-xs text-slate-600">
          {card.tender.details}
        </p>
      ) : null}

      <span
        className={cn(
          "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
          style.badge,
        )}
      >
        {style.label}
      </span>
    </div>
  );
}

function buildHoverCard(tender: Tender, element: HTMLElement): HoverCard {
  const rect = element.getBoundingClientRect();

  /* Keep the card on screen when the event sits near either edge. */
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, 140),
    window.innerWidth - 140,
  );

  return { tender, top: rect.top - 8, left };
}

function TenderList({
  tenders,
  system,
  onSelectTender,
}: {
  tenders: Tender[];
  system: CalendarSystem;
  onSelectTender?: (tender: Tender) => void;
}) {
  if (tenders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
        No tenders scheduled yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2 text-left font-bold">Tender</th>
            <th className="px-4 py-2 text-left font-bold">Submission</th>
            <th className="px-4 py-2 text-left font-bold">Closing</th>
            <th className="px-4 py-2 text-left font-bold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {tenders.map((tender) => (
            <tr
              key={tender.id}
              onClick={() => onSelectTender?.(tender)}
              className={cn(
                "text-slate-700",
                onSelectTender && "cursor-pointer transition hover:bg-slate-50",
              )}
            >
              <td className="px-4 py-2.5">
                <p
                  className={cn(
                    "font-semibold",
                    tender.ended
                      ? "text-slate-400 line-through"
                      : "text-slate-900",
                  )}
                >
                  {tender.title}
                </p>
                {tender.details ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {tender.details}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                {formatCalendarDate(tender.submissionDate, system)}
              </td>
              <td className="px-4 py-2.5">
                {formatCalendarDate(tender.closingDate, system)}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    tenderStyle(tender).badge,
                  )}
                >
                  {tenderStyle(tender).label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
