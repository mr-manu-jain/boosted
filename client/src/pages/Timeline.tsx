import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useEntries, useDeleteEntry } from '../hooks/queries';
import { useTimer } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { themedColor } from '../lib/palette';
import { formatClock, formatDuration, formatTime, friendlyDay } from '../lib/format';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { RecordModal } from '../components/timeline/RecordModal';
import type { TimeEntry } from '../types';
import styles from './Timeline.module.css';

interface DayGroup {
  dayKey: string;
  totalSeconds: number;
  entries: TimeEntry[];
}

export function Timeline() {
  const { theme } = useTheme();
  const { data: entries = [], isLoading } = useEntries({ limit: 200 });
  const deleteEntry = useDeleteEntry();
  const { running, elapsedSeconds, stop, isPending } = useTimer();
  const [showRecord, setShowRecord] = useState(false);

  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    for (const entry of entries) {
      let group = groups.get(entry.dayKey);
      if (!group) {
        group = { dayKey: entry.dayKey, totalSeconds: 0, entries: [] };
        groups.set(entry.dayKey, group);
      }
      group.entries.push(entry);
      group.totalSeconds += entry.durationSeconds ?? 0;
    }
    return [...groups.values()].sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  }, [entries]);

  const runningColor = running?.projectColor
    ? themedColor(running.projectColor, theme)
    : null;

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Timeline</h1>
        <button type="button" className="btn btn-ghost" onClick={() => setShowRecord(true)}>
          <Icon name="plus" size={16} />
          New record
        </button>
      </div>

      {running && runningColor && (
        <motion.div
          className={styles.trackingCard}
          style={{
            background: `linear-gradient(150deg, ${runningColor} 0%, color-mix(in srgb, ${runningColor} 40%, #16161a) 100%)`,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.trackingInfo}>
            <p className={styles.trackingLabel}>
              <span className={styles.pulse} />
              Tracking
            </p>
            <p className={styles.trackingProject}>{running.projectName}</p>
            {running.taskName && <p className={styles.trackingTask}>{running.taskName}</p>}
          </div>
          <div className={styles.trackingRight}>
            <span className={`${styles.trackingClock} tnum`}>{formatClock(elapsedSeconds)}</span>
            <button
              type="button"
              className={`btn ${styles.stopBtn}`}
              disabled={isPending}
              onClick={() => void stop()}
            >
              <Icon name="stop" size={15} />
              Stop
            </button>
          </div>
        </motion.div>
      )}

      {isLoading && <Skeleton rows={4} />}

      {!isLoading && entries.length === 0 && !running && (
        <div className={`card ${styles.empty}`}>
          <p className={styles.emptyTitle}>Nothing tracked yet</p>
          <p>Head to Projects and hit Start — your records will show up here.</p>
        </div>
      )}

      {dayGroups.map((group) => (
        <section key={group.dayKey} className={styles.dayGroup}>
          <div className={styles.dayHead}>
            <h2 className={styles.dayName}>{friendlyDay(group.dayKey)}</h2>
            <span className={`${styles.dayTotal} tnum`}>{formatClock(group.totalSeconds)}</span>
          </div>
          <div className={styles.entryList}>
            {group.entries.map((entry) => (
              <div key={entry.id} className={`card ${styles.entryRow}`}>
                <span
                  className={styles.dot}
                  style={{ background: themedColor(entry.project.color, theme) }}
                />
                <div className={styles.entryMain}>
                  <p className={styles.entryProject}>{entry.project.name}</p>
                  <p className={styles.entryMeta}>
                    {formatTime(entry.startTime)}
                    {entry.endTime ? ` – ${formatTime(entry.endTime)}` : ''}
                    {entry.task ? ` · ${entry.task.name}` : ''}
                  </p>
                </div>
                <span className={`${styles.durationChip} tnum`}>
                  {formatDuration(entry.durationSeconds ?? 0)}
                </span>
                <button
                  type="button"
                  className={styles.entryDelete}
                  aria-label="Delete record"
                  onClick={() => {
                    if (window.confirm('Delete this record?')) {
                      deleteEntry.mutate(entry.id);
                    }
                  }}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <RecordModal open={showRecord} onClose={() => setShowRecord(false)} />
    </div>
  );
}
