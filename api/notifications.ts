import client from "./client";
import type { Notification } from "../types";

type ListResponse = { success: boolean; data: Notification[]; unread: number };
type ItemResponse = { success: boolean; data: Notification };

export const fetchNotifications = (): Promise<{ items: Notification[]; unread: number }> =>
  client.get<ListResponse>("/notification").then((r) => ({ items: r.data.data, unread: r.data.unread }));

export const markNotificationRead = (id: string): Promise<Notification> =>
  client.put<ItemResponse>(`/notification/${id}/read`).then((r) => r.data.data);

export const markAllNotificationsRead = (): Promise<void> =>
  client.put("/notification/read-all").then(() => undefined);

export const removeNotification = (id: string): Promise<void> =>
  client.delete(`/notification/${id}`).then(() => undefined);

export const clearAllNotifications = (): Promise<void> =>
  client.delete("/notification").then(() => undefined);
