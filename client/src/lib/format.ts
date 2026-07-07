/** 4525 -> "01:15:25" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/** 4525 -> "1h 15m"; 90 -> "1m 30s"; 0 -> "0m" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) {
    const sec = s % 60;
    return sec > 0 && m < 10 ? `${m}m ${sec}s` : `${m}m`;
  }
  return `${s % 60}s`;
}

/** "2026-07-06" for a Date in the browser's local time */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** dayKey -> "Today" | "Yesterday" | "Mon, 6 Jul" */
export function friendlyDay(dayKey: string): string {
  const today = localDayKey(new Date());
  if (dayKey === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === localDayKey(yesterday)) return 'Yesterday';
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Shift a "YYYY-MM-DD" key by n days (n may be negative). */
export function shiftDayKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return localDayKey(date);
}

/** Monday day-key of the week containing the given day key. */
export function weekStartKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay() || 7;
  return shiftDayKey(key, -(day - 1));
}

/** dayKey -> "6 Jul" */
export function shortDay(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

/** ISO datetime -> "21:36" local */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
