import { ResponsivePie } from '@nivo/pie';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, nivoTheme } from '../../lib/chartTheme';
import { themedColor } from '../../lib/palette';
import { formatDuration } from '../../lib/format';
import type { ReportSummary } from '../../types';
import styles from './ProjectDonut.module.css';

interface ProjectDonutProps {
  distribution: ReportSummary['distribution'];
  totalSeconds: number;
}

export function ProjectDonut({ distribution, totalSeconds }: ProjectDonutProps) {
  const { theme } = useTheme();
  const chrome = chartChrome[theme];

  const data = distribution.map((d) => ({
    id: d.projectId,
    label: d.name,
    value: d.seconds,
    color: themedColor(d.color, theme),
  }));

  if (data.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.chart}>
        <ResponsivePie
          data={data}
          theme={nivoTheme(theme)}
          colors={{ datum: 'data.color' }}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          innerRadius={0.74}
          padAngle={1.6}
          cornerRadius={4}
          activeOuterRadiusOffset={5}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          tooltip={({ datum }) => (
            <div
              style={{
                background: chrome.surface,
                color: chrome.textPrimary,
                border: `1px solid ${chrome.border}`,
                borderRadius: 10,
                boxShadow: chrome.shadow,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: datum.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: chrome.textSecondary }}>{datum.label}</span>
              <strong>{formatDuration(datum.value)}</strong>
            </div>
          )}
        />
        <div className={styles.center}>
          <span className={styles.centerValue}>{formatDuration(totalSeconds)}</span>
          <span className={styles.centerLabel}>tracked</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {data.map((d) => {
          const pct = totalSeconds > 0 ? Math.round((d.value / totalSeconds) * 100) : 0;
          return (
            <li key={d.id} className={styles.legendRow}>
              <span className={styles.dot} style={{ background: d.color }} />
              <span className={styles.legendName}>{d.label}</span>
              <span className={`${styles.legendValue} tnum`}>{formatDuration(d.value)}</span>
              <span className={`${styles.legendPct} tnum`}>{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
