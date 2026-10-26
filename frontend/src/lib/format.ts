export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const fmtRange = (iso: string, minutes: number) =>
  `${fmtTime(iso)} – ${fmtTime(new Date(new Date(iso).getTime() + minutes * 60_000).toISOString())}`;

/** Groups items by calendar day, keeping the input order. */
export function groupByDay<T extends { startsAt: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = fmtDay(item.startsAt);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()];
}

/** Today's date as YYYY-MM-DD in local time, for <input type="date" min>. */
export function todayLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
