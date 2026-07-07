import type { ReactNode } from 'react';
import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  hero?: boolean;
}

export function StatTile({ label, value, sub, hero }: StatTileProps) {
  return (
    <div className={`card ${styles.tile} ${hero ? styles.hero : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} tnum`}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  );
}
