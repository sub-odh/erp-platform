import { apiRequest } from "@/lib/api";
import type { Notification, NotificationPage } from "@/types/notification";

export function listNotifications(limit = 20): Promise<NotificationPage> {
  return apiRequest(`/notifications?page=1&limit=${limit}`);
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiRequest("/notifications/unread-count");
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}
