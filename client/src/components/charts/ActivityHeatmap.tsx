import { useEffect, useRef } from 'react';
import { ResponsiveTimeRange } from '@nivo/calendar';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, heatmapRamp, nivoTheme } from '../../lib/chartTheme';
import { formatDuration, shortDay } from '../../lib/format';
import type { HeatmapData } from '../../types';
import styles from './ActivityHeatmap.module.css';

interface ActivityHeatmapProps {
  data: HeatmapData;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { theme } = useTheme();
  const chrome = chartChrome[theme];
  const scrollRef = useRef<HTMLDivElement>(null);

  // land on the most recent months (mobile shows a scrollable strip)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data]);

  return (
    <div className={styles.scroller} ref={scrollRef}>
      <div className={styles.inner}>
        <ResponsiveTimeRange
          data={data.days}
          from={data.from}
          to={data.to}
          theme={nivoTheme(theme)}
          colors={heatmapRamp[theme]}
          emptyColor={chrome.empty}
          dayRadius={3}
          daySpacing={3}
          dayBorderWidth={0}
          margin={{ top: 24, right: 16, bottom: 4, left: 42 }}
          weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          weekdayLegendOffset={38}
          weekdayTicks={[1, 3, 5]}
          monthLegendOffset={12}
          tooltip={({ day, value }) => (
            <div
              style={{
                background: chrome.surface,
                color: chrome.textPrimary,
                border: `1px solid ${chrome.border}`,
                borderRadius: 10,
                boxShadow: chrome.shadow,
                padding: '7px 11px',
                fontSize: 12,
                display: 'flex',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: chrome.textSecondary }}>{shortDay(day)}</span>
              <strong>{formatDuration(Number(value))}</strong>
            </div>
          )}
        />
      </div>
    </div>
  );
}
