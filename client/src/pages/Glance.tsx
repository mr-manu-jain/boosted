import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGlance } from '../hooks/queries';
import { useTheme } from '../context/ThemeContext';
import { themedColor } from '../lib/palette';
import { formatClock, formatDuration, localDayKey, shiftDayKey, weekStartKey } from '../lib/format';
import { Icon } from '../components/common/Icon';
import styles from './Glance.module.css';

type Period = 'day' | 'week';

export function Glance() {
  const { theme } = useTheme();
  const today = localDayKey(new Date());
  const [period, setPeriod] = useState<Period>('day');
  const [dayKey, setDayKey] = useState(today);
  const [weekStart, setWeekStart] = useState(weekStartKey(today));

  const key = period === 'day' ? dayKey : weekStart;
  const { data: glance, isLoading } = useGlance(period, key);

  const canGoForward = period === 'day' ? dayKey < today : weekStart < weekStartKey(today);

  function navigate(direction: 1 | -1) {
    if (period === 'day') {
      setDayKey((k) => shiftDayKey(k, direction));
    } else {
      setWeekStart((k) => shiftDayKey(k, 7 * direction));
    }
  }

  const delta = glance ? glance.totalSeconds - glance.previousTotalSeconds : 0;
  const maxProjectSeconds = Math.max(...(glance?.projects.map((p) => p.seconds) ?? [0]), 1);

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Glance</h1>
        <div className={styles.segment}>
          {(['day', 'week'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={
                period === p ? `${styles.segmentBtn} ${styles.segmentActive}` : styles.segmentBtn
              }
              onClick={() => setPeriod(p)}
            >
              {p === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(-1)}
          aria-label="Previous period"
        >
          <Icon name="chevron-left" size={19} />
        </button>
        <span className={styles.navLabel}>{glance?.label ?? '…'}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(1)}
          disabled={!canGoForward}
          aria-label="Next period"
        >
          <Icon name="chevron-right" size={19} />
        </button>
      </div>

      {glance && glance.totalSeconds === 0 && !isLoading && (
        <div className={`card ${styles.empty}`}>
          <p>Nothing tracked in this period.</p>
        </div>
      )}

      {glance && glance.totalSeconds > 0 && (
        <>
          <motion.div
            className={`card ${styles.hero}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className={styles.heroLabel}>Total tracked</p>
            <div className={`${styles.heroValue} tnum`}>{formatClock(glance.totalSeconds)}</div>
            {glance.previousTotalSeconds > 0 && (
              <span className={`${styles.delta} ${delta >= 0 ? styles.deltaUp : ''}`}>
                {delta >= 0 ? '▲' : '▼'} {formatDuration(Math.abs(delta))} vs previous{' '}
                {period === 'day' ? 'day' : 'week'}
              </span>
            )}
            <div className={styles.heroMeta}>
              <span>
                <strong className="tnum">{glance.entryCount}</strong> sessions
              </span>
              {period === 'week' && (
                <>
                  <span>
                    <strong className="tnum">{glance.activeDays}</strong> active days
                  </span>
                  <span>
                    <strong className="tnum">
                      {formatDuration(
                        glance.activeDays > 0
                          ? Math.round(glance.totalSeconds / glance.activeDays)
                          : 0,
                      )}
                    </strong>{' '}
                    per day
                  </span>
                </>
              )}
            </div>
          </motion.div>

          <motion.section
            className={`card ${styles.aiCard}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className={styles.aiHead}>
              <Icon name="eye" size={16} />
              In a glance
            </div>
            {glance.aiSummary ? (
              <>
                <p className={styles.aiSummary}>{glance.aiSummary}</p>
                {glance.aiTips && (
                  <p className={styles.aiTip}>
                    <strong>Tip:</strong> {glance.aiTips}
                  </p>
                )}
              </>
            ) : (
              <p className={styles.aiSummary}>
                AI recap is unavailable right now — your stats are below.
              </p>
            )}
          </motion.section>

          <motion.section
            className={`card ${styles.section}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className={styles.sectionTitle}>By project</h2>
            {glance.projects.map((p, i) => {
              const color = themedColor(p.color, theme);
              return (
                <div key={p.projectId} className={styles.projectRow}>
                  <span className={styles.projectName}>
                    <span className={styles.dot} style={{ background: color }} />
                    <span>{p.name}</span>
                  </span>
                  <div className={styles.barTrack}>
                    <motion.div
                      className={styles.barFill}
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(p.seconds / maxProjectSeconds) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.55, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={`${styles.projectValue} tnum`}>
                    {formatDuration(p.seconds)}
                  </span>
                </div>
              );
            })}
          </motion.section>
        </>
      )}

      {isLoading && (
        <div className={`card ${styles.section}`}>
          <div className={styles.skeleton} style={{ width: '60%' }} />
          <div className={styles.skeleton} style={{ width: '85%' }} />
          <div className={styles.skeleton} style={{ width: '40%' }} />
        </div>
      )}
    </div>
  );
}
