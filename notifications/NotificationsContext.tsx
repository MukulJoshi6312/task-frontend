import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification as apiRemove,
  clearAllNotifications,
} from "../api/notifications";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../types";

type NotificationsContextValue = {
  items: Notification[];
  unread: number;
  loading: boolean;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch (e) {
      console.error("[Notifications] reload failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on login, clear on logout.
  useEffect(() => {
    if (user) reload();
    else { setItems([]); setUnread(0); }
  }, [user, reload]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic — flip locally first.
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await markNotificationRead(id); }
    catch (e) { console.warn("[Notifications] markRead failed:", e); }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await markAllNotificationsRead(); }
    catch (e) { console.warn("[Notifications] markAllRead failed:", e); }
  }, []);

  const remove = useCallback(async (id: string) => {
    const before = items.find((n) => n._id === id);
    // Optimistic removal.
    setItems((prev) => prev.filter((n) => n._id !== id));
    if (before && !before.read) setUnread((u) => Math.max(0, u - 1));
    try { await apiRemove(id); }
    catch (e) {
      console.warn("[Notifications] remove failed:", e);
      // Roll back.
      if (before) setItems((prev) => [before, ...prev]);
    }
  }, [items]);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnread(0);
    try { await clearAllNotifications(); }
    catch (e) { console.warn("[Notifications] clearAll failed:", e); }
  }, []);

  return (
    <NotificationsContext.Provider value={{ items, unread, loading, reload, markRead, markAllRead, remove, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
};
