const HEARTBEATS_KEY = "erp.tabHeartbeats";
const TAB_ID_KEY = "erp.tabId";
const LEFT_AT_KEY = "erp.browserLeftAt";

const HEARTBEAT_MS = 5_000;
const FRESH_MS = 120_000;
const RELOAD_GRACE_MS = 120_000;
const HISTORY_GRACE_MS = 1_500;

type Heartbeats = Record<string, number>;

export function isBrowserSessionClosed(input: {
  localLeft: string | null;
  sessionLeft: string | null;
  navigationType: string | undefined;
  now: number;
  otherTabsFresh: boolean;
}): boolean {
  if (input.otherTabsFresh || input.localLeft === null) {
    return false;
  }

  const age = input.now - Number(input.localLeft);
  const sameTab = input.sessionLeft !== null && input.sessionLeft === input.localLeft;

  if (!sameTab || !Number.isFinite(age)) {
    return true;
  }

  if (input.navigationType === "reload") {
    return age >= RELOAD_GRACE_MS;
  }

  return age >= HISTORY_GRACE_MS;
}

let stopWatch: (() => void) | null = null;
let onBrowserClosed: (() => void) | null = null;
let closedDecision: boolean | null = null;

export function setBrowserClosedHandler(handler: () => void): void {
  onBrowserClosed = handler;
}

export function startBrowserSessionWatch(): void {
  closedDecision = false;

  if (typeof window === "undefined" || stopWatch) {
    return;
  }

  touchHeartbeat();

  const timer = window.setInterval(touchHeartbeat, HEARTBEAT_MS);

  const onHide = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      return;
    }

    markLastTabClosed();
  };

  const onShow = (): void => {
    if (!takeClosedBrowserSession()) {
      touchHeartbeat();
      return;
    }

    onBrowserClosed?.();
  };

  window.addEventListener("pagehide", onHide);
  window.addEventListener("pageshow", onShow);
  document.addEventListener("visibilitychange", touchHeartbeat);

  stopWatch = () => {
    window.clearInterval(timer);
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("pageshow", onShow);
    document.removeEventListener("visibilitychange", touchHeartbeat);
    stopWatch = null;
  };
}

export function resetBrowserSessionTracking(): void {
  if (typeof window === "undefined") {
    return;
  }

  stopWatch?.();

  const tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (tabId) {
    const heartbeats = readHeartbeats();
    delete heartbeats[tabId];
    writeHeartbeats(heartbeats);
  }

  localStorage.removeItem(LEFT_AT_KEY);
  sessionStorage.removeItem(LEFT_AT_KEY);
}

export function takeClosedBrowserSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (closedDecision !== null) {
    return closedDecision;
  }

  const localLeft = localStorage.getItem(LEFT_AT_KEY);
  const sessionLeft = sessionStorage.getItem(LEFT_AT_KEY);
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  const closed = isBrowserSessionClosed({
    localLeft,
    sessionLeft,
    navigationType: navigation?.type,
    now: Date.now(),
    otherTabsFresh: hasFreshOtherTabs(),
  });

  localStorage.removeItem(LEFT_AT_KEY);
  sessionStorage.removeItem(LEFT_AT_KEY);
  closedDecision = closed;

  return closed;
}

function markLastTabClosed(): void {
  closedDecision = null;

  const tabId = sessionStorage.getItem(TAB_ID_KEY);
  const heartbeats = readHeartbeats();

  if (tabId) {
    delete heartbeats[tabId];
    writeHeartbeats(heartbeats);
  }

  if (hasFreshHeartbeats(heartbeats)) {
    return;
  }

  const stamp = String(Date.now());
  localStorage.setItem(LEFT_AT_KEY, stamp);
  sessionStorage.setItem(LEFT_AT_KEY, stamp);
}

function touchHeartbeat(): void {
  if (document.visibilityState === "hidden") {
    return;
  }

  const tabId = currentTabId();
  const now = Date.now();
  const heartbeats = readHeartbeats();

  for (const [id, seenAt] of Object.entries(heartbeats)) {
    if (now - seenAt >= FRESH_MS) {
      delete heartbeats[id];
    }
  }

  heartbeats[tabId] = now;
  writeHeartbeats(heartbeats);
}

function hasFreshOtherTabs(): boolean {
  const tabId = sessionStorage.getItem(TAB_ID_KEY);
  const now = Date.now();

  return Object.entries(readHeartbeats()).some(
    ([id, seenAt]) => id !== tabId && now - seenAt < FRESH_MS,
  );
}

function hasFreshHeartbeats(heartbeats: Heartbeats): boolean {
  const now = Date.now();

  return Object.values(heartbeats).some((seenAt) => now - seenAt < FRESH_MS);
}

function currentTabId(): string {
  const existing = sessionStorage.getItem(TAB_ID_KEY);

  if (existing) {
    return existing;
  }

  const created = window.crypto.randomUUID();
  sessionStorage.setItem(TAB_ID_KEY, created);

  return created;
}

function readHeartbeats(): Heartbeats {
  try {
    const parsed = JSON.parse(localStorage.getItem(HEARTBEATS_KEY) || "{}") as Heartbeats;

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeHeartbeats(heartbeats: Heartbeats): void {
  localStorage.setItem(HEARTBEATS_KEY, JSON.stringify(heartbeats));
}
