/** "YYYY-MM-DD" for a Date, in the given IANA timezone. */
export function getDayKey(date: Date, timezone: string): string {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** All day keys between two keys, inclusive. Keys are "YYYY-MM-DD". */
export function dayKeyRange(fromKey: string, toKey: string): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${fromKey}T00:00:00Z`);
  const end = new Date(`${toKey}T00:00:00Z`);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

/** Shift a day key by n days (n may be negative). */
export function shiftDayKey(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** ISO week key like "2026-W27" for a day key. */
export function isoWeekKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  // ISO week: Thursday determines the year
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Monday day-key of the ISO week containing the given day key. */
export function weekStartKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}
