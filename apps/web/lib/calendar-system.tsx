"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CalendarSystem } from "@/lib/nepali-date";

const STORAGE_KEY = "erp.calendarSystem";

interface CalendarSystemValue {
  system: CalendarSystem;
  setSystem: (next: CalendarSystem) => void;
  toggle: () => void;
}

const CalendarSystemContext = createContext<CalendarSystemValue | null>(null);

export function CalendarSystemProvider({ children }: { children: ReactNode }) {
  /*
   * Always start on AD so the server and first client render agree, then adopt
   * the stored choice once mounted.
   */
  const [system, setSystemState] = useState<CalendarSystem>("AD");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "BS" || stored === "AD") {
      setSystemState(stored);
    }
  }, []);

  const setSystem = useCallback((next: CalendarSystem) => {
    setSystemState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<CalendarSystemValue>(
    () => ({
      system,
      setSystem,
      toggle: () => setSystem(system === "AD" ? "BS" : "AD"),
    }),
    [system, setSystem],
  );

  return (
    <CalendarSystemContext.Provider value={value}>
      {children}
    </CalendarSystemContext.Provider>
  );
}

export function useCalendarSystem(): CalendarSystemValue {
  const value = useContext(CalendarSystemContext);

  if (!value) {
    throw new Error(
      "useCalendarSystem must be used inside a CalendarSystemProvider",
    );
  }

  return value;
}
