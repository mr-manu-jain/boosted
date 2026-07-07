import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useHeatmap, useProjects, useReportSummary } from '../hooks/queries';
import { useTheme } from '../context/ThemeContext';
import { themedColor } from '../lib/palette';
import { formatClock, formatDuration, localDayKey, shiftDayKey } from '../lib/format';
import { Icon } from '../components/common/Icon';
import { StatTile } from '../components/common/StatTile';
import { Skeleton } from '../components/common/Skeleton';
import { StackedDurationBar } from '../components/charts/StackedDurationBar';
import { ProjectDonut } from '../components/charts/ProjectDonut';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import styles from './Reports.module.css';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last year', days: 365 },
];

const sectionAnim = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: 'easeOut' as const },
};

export function Reports() {
  const { theme } = useTheme();
  const [preset, setPreset] = useState(PRESETS[1]);
  const [heatmapProject, setHeatmapProject] = useState<string | undefined>(undefined);

  const today = localDayKey(new Date());
  const from = shiftDayKey(today, -(preset.days - 1));
  const heatmapFrom = shiftDayKey(today, -364);

  const { data: summary, isLoading } = useReportSummary(from, today);
  const { data: heatmap } = useHeatmap(heatmapFrom, today, heatmapProject);
  const { data: projects = [] } = useProjects();

  const legendItems = useMemo(
    () =>
      (summary?.distribution ?? []).map((d) => ({
        id: d.projectId,
        name: d.name,
        color: themedColor(d.color, theme),
      })),
    [summary, theme],
  );

  const hasData = (summary?.totalSeconds ?? 0) > 0;

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Reports</h1>
        <div className={styles.chips}>
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              className={p.days === preset.days ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => setPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Skeleton rows={3} height={110} />}

      {!isLoading && !hasData && (
        <div className={`card ${styles.empty}`}>
          <p>No tracked time in this range yet — start a timer and check back.</p>
        </div>
      )}

      {summary && hasData && (
        <>
          <motion.div className={styles.tiles} {...sectionAnim}>
            <StatTile
              hero
              label="Average daily tracked"
              value={formatClock(summary.averageDailySeconds)}
              sub={`across ${summary.activeDays} active day${summary.activeDays === 1 ? '' : 's'}`}
            />
            <StatTile label="Total tracked" value={formatDuration(summary.totalSeconds)} />
            <StatTile
              label="Projects · Tasks"
              value={`${summary.projectsTracked} · ${summary.tasksTracked}`}
              sub="tracked in range"
            />
          </motion.div>

          <motion.section className={`card ${styles.section}`} {...sectionAnim}>
            <h2 className={styles.sectionTitle}>Duration per day</h2>
            <p className={styles.sectionSub}>
              {preset.days > 70 ? 'Weekly totals, stacked by project' : 'Stacked by project'}
            </p>
            <StackedDurationBar
              durationPerDay={summary.durationPerDay}
              distribution={summary.distribution}
              rangeDays={preset.days}
            />
            <div className={styles.barLegend}>
              {legendItems.map((item) => (
                <span key={item.id} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: item.color }} />
                  {item.name}
                </span>
              ))}
            </div>
          </motion.section>

          <motion.section className={`card ${styles.section}`} {...sectionAnim}>
            <h2 className={styles.sectionTitle}>Time distribution</h2>
            <p className={styles.sectionSub}>Where your {formatDuration(summary.totalSeconds)} went</p>
            <ProjectDonut distribution={summary.distribution} totalSeconds={summary.totalSeconds} />
          </motion.section>
        </>
      )}

      <motion.section className={`card ${styles.section}`} {...sectionAnim}>
        <h2 className={styles.sectionTitle}>Activity</h2>
        <p className={styles.sectionSub}>
          {heatmap
            ? `${heatmap.totalActiveDays} active days in the last year`
            : 'Your last 12 months'}
        </p>

        <div className={styles.filterRow}>
          <button
            type="button"
            className={!heatmapProject ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            onClick={() => setHeatmapProject(undefined)}
          >
            All projects
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                heatmapProject === p.id ? `${styles.chip} ${styles.chipActive}` : styles.chip
              }
              onClick={() => setHeatmapProject(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {heatmap && <ActivityHeatmap data={heatmap} />}

        {heatmap && (
          <div className={styles.streaks}>
            <span className={styles.streak}>
              <Icon name="flame" size={17} className={styles.flame} />
              Max streak <span className={`${styles.streakValue} tnum`}>{heatmap.maxStreak}</span>
            </span>
            <span className={styles.streak}>
              Current streak{' '}
              <span className={`${styles.streakValue} tnum`}>{heatmap.currentStreak}</span>
            </span>
            <span className={styles.streak}>
              Active days{' '}
              <span className={`${styles.streakValue} tnum`}>{heatmap.totalActiveDays}</span>
            </span>
          </div>
        )}
      </motion.section>
    </div>
  );
}
