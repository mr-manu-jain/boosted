import { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, nivoTheme } from '../../lib/chartTheme';
import { themedColor } from '../../lib/palette';
import { formatDuration, shortDay, weekStartKey } from '../../lib/format';
import type { ReportSummary } from '../../types';

interface StackedDurationBarProps {
  durationPerDay: ReportSummary['durationPerDay'];
  distribution: ReportSummary['distribution'];
  /** span of the selected range in days — ranges over ~70d bucket by week */
  rangeDays: number;
}

interface BarRow {
  bucket: string;
  label: string;
  [projectId: string]: string | number;
}

export function StackedDurationBar({
  durationPerDay,
  distribution,
  rangeDays,
}: StackedDurationBarProps) {
  const { theme } = useTheme();
  const chrome = chartChrome[theme];

  const weekly = rangeDays > 70;

  const { rows, keys, colorById, nameById } = useMemo(() => {
    // stack order: biggest project at the bottom (fixed by entity, not repainted)
    const ordered = [...distribution].sort((a, b) => b.seconds - a.seconds);
    const keys = ordered.map((d) => d.projectId);
    const colorById = new Map(ordered.map((d) => [d.projectId, themedColor(d.color, theme)]));
    const nameById = new Map(ordered.map((d) => [d.projectId, d.name]));

    const buckets = new Map<string, BarRow>();
    for (const day of durationPerDay) {
      const bucket = weekly ? weekStartKey(day.dayKey) : day.dayKey;
      let row = buckets.get(bucket);
      if (!row) {
        row = { bucket, label: shortDay(bucket) };
        buckets.set(bucket, row);
      }
      for (const [projectId, seconds] of Object.entries(day.byProject)) {
        row[projectId] = ((row[projectId] as number) ?? 0) + seconds;
      }
    }
    const rows = [...buckets.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
    return { rows, keys, colorById, nameById };
  }, [durationPerDay, distribution, weekly, theme]);

  const tickValues = useMemo(() => {
    const step = Math.max(1, Math.ceil(rows.length / 8));
    return rows.filter((_, i) => i % step === 0).map((r) => r.label);
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div style={{ height: 280 }}>
      <ResponsiveBar
        data={rows}
        keys={keys}
        indexBy="label"
        theme={nivoTheme(theme)}
        colors={(bar) => colorById.get(String(bar.id)) ?? chrome.muted}
        margin={{ top: 8, right: 8, bottom: 34, left: 44 }}
        padding={rows.length > 20 ? 0.25 : 0.4}
        borderRadius={2}
        borderWidth={1.5}
        borderColor={chrome.surface}
        enableLabel={false}
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 4,
          format: (v: number) => {
            if (v === 0) return '';
            const h = v / 3600;
            return `${h >= 3 ? Math.round(h) : Math.round(h * 10) / 10}h`;
          },
        }}
        gridYValues={4}
        valueFormat={(v) => formatDuration(Number(v))}
        tooltip={({ id, value, indexValue, color }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }}
            />
            <span style={{ color: chrome.textSecondary }}>
              {nameById.get(String(id))} · {weekly ? `wk of ${indexValue}` : indexValue}
            </span>
            <strong style={{ color: chrome.textPrimary }}>{formatDuration(Number(value))}</strong>
          </div>
        )}
        role="img"
        ariaLabel="Tracked duration per day by project"
      />
    </div>
  );
}
