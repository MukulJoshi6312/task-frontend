import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREF_KEY = "taskly:reminders";

// ── Foreground behavior ────────────────────────────────────────────────────
// Without this, notifications scheduled while the app is open won't show.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Init ──────────────────────────────────────────────────────────────────
// Call once on app startup. Sets up the Android channel (no-op on iOS).
let initialised = false;
export async function initNotifications() {
  if (initialised) return;
  initialised = true;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

// ── Preference (per device) ───────────────────────────────────────────────
export async function getRemindersEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(PREF_KEY);
  return v !== "off";  // default ON
}
export async function setRemindersEnabled(on: boolean) {
  await AsyncStorage.setItem(PREF_KEY, on ? "on" : "off");
  if (!on) await cancelAllReminders();
}

// ── Permission ────────────────────────────────────────────────────────────
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

// ── Schedule / cancel ─────────────────────────────────────────────────────
// We use the task's MongoDB _id as the notification identifier so we can
// cancel/reschedule without storing a mapping.
type ScheduleInput = {
  id: string;          // task _id
  title: string;
  body?: string;
  date: Date | string; // due date
};

export async function scheduleTaskReminder(input: ScheduleInput) {
  const enabled = await getRemindersEnabled();
  if (!enabled) return;

  const when = input.date instanceof Date ? input.date : new Date(input.date);
  if (Number.isNaN(when.getTime())) return;
  if (when.getTime() <= Date.now()) return; // never schedule in the past

  if (!(await ensurePermission())) return;

  // Cancel any existing reminder for this task first (handles edits).
  await Notifications.cancelScheduledNotificationAsync(input.id).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: {
      title: input.title || "Task due",
      body: input.body || "Tap to open.",
      sound: "default",
      data: { taskId: input.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
}

export async function cancelTaskReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
