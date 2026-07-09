export type SceneStatus = "upcoming" | "live" | "ended";

export function getSceneStatus(startsAt: string, endsAt: string | null): SceneStatus {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (start > now) return "upcoming";
  if (end !== null && end < now) return "ended";
  return "live";
}

export function formatSceneTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  // Within the next week, "Saturday, 9:00 PM" reads much more
  // naturally than a bare date.
  const daysAway = Math.round((date.getTime() - now.getTime()) / 86400000);
  if (daysAway >= 0 && daysAway < 7) {
    const weekday = date.toLocaleDateString([], { weekday: "long" });
    return `${weekday}, ${time}`;
  }

  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}