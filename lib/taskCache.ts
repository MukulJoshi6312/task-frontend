import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task } from "../types";

// Per-user cached task list so the app shows something when offline.
// Keyed by user id so logging in as another user can't read yours.
const key = (userId: string) => `taskly:tasks:${userId}`;

export const taskCache = {
  async save(userId: string, tasks: Task[]) {
    try { await AsyncStorage.setItem(key(userId), JSON.stringify(tasks)); }
    catch (e) { console.warn("[taskCache] save failed:", e); }
  },
  async load(userId: string): Promise<Task[] | null> {
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      return raw ? (JSON.parse(raw) as Task[]) : null;
    } catch { return null; }
  },
  async clear(userId: string) {
    try { await AsyncStorage.removeItem(key(userId)); }
    catch (e) { console.warn("[taskCache] clear failed:", e); }
  },
};
