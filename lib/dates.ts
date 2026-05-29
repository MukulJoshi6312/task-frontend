// All date helpers in one place. ISO strings in, friendly strings out.

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);

const time = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const dayMonth = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** "Today · 4:00 PM", "Tomorrow", "Fri, 30 May · 10:00 AM" */
export function formatDue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = daysBetween(d, now);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (diff === 0) return hasTime ? `Today · ${time(d)}` : "Today";
  if (diff === 1) return hasTime ? `Tomorrow · ${time(d)}` : "Tomorrow";
  if (diff === -1) return hasTime ? `Yesterday · ${time(d)}` : "Yesterday";
  return hasTime ? `${dayMonth(d)} · ${time(d)}` : dayMonth(d);
}

export const isToday = (iso?: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return daysBetween(d, new Date()) === 0;
};

export const isUpcoming = (iso?: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return daysBetween(d, new Date()) > 0;
};

/** "Good morning" / "Good afternoon" / "Good evening" / "Working late" */
export function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5)  return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Working late";
}
