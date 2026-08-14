"use client";

import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import type { Notification } from "@/types/notification";

export function NotificationsDropdown() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      setUnreadCount((await getUnreadNotificationCount()).count);
    } catch {
      // Session-level API handling owns authentication failures.
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const [page, unread] = await Promise.all([
        listNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(page.data);
      setUnreadCount(unread.count);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 60_000);
    return () => window.clearInterval(interval);
  }, [refreshCount]);

  useEffect(() => {
    if (open) void refreshList();
  }, [open, refreshList]);

  useEffect(() => {
    function close(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function openNotification(item: Notification): Promise<void> {
    if (!item.readAt) {
      try {
        await markNotificationRead(item.id);
        setNotifications((current) =>
          current.map((value) =>
            value.id === item.id
              ? { ...value, readAt: new Date().toISOString() }
              : value,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Navigation remains available if read-state persistence is unavailable.
      }
    }
    setOpen(false);
    if (item.actionUrl) router.push(item.actionUrl);
  }

  async function markAllRead(): Promise<void> {
    try {
      await markAllNotificationsRead();
    } catch {
      return;
    }
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
    );
    setUnreadCount(0);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.48)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_24px_-10px_rgba(15,23,42,0.42)]"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-200 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            {unreadCount ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-105 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <Inbox size={28} className="text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  You’re all caught up
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  New assignments and updates appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={[
                    "relative block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50",
                    item.readAt ? "bg-white" : "bg-blue-50/60",
                  ].join(" ")}
                >
                  {!item.readAt ? (
                    <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-blue-500" />
                  ) : null}
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                    {item.message}
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRelativeTime(value: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
