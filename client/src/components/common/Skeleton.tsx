import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** number of placeholder rows */
  rows?: number;
  height?: number;
}

export function Skeleton({ rows = 3, height = 56 }: SkeletonProps) {
  return (
    <div className={styles.list} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} style={{ height, animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}
