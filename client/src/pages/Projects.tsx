import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects, useCreateProject } from '../hooks/queries';
import { useTimer } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { themedColor } from '../lib/palette';
import { formatClock } from '../lib/format';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import styles from './Projects.module.css';

export function Projects() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const { running, elapsedSeconds, start, stop, isPending } = useTimer();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Projects</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={17} />
          New project
        </button>
      </div>

      {isLoading && <Skeleton rows={4} />}

      {!isLoading && projects.length === 0 && (
        <div className={`card ${styles.empty}`}>
          <p className={styles.emptyTitle}>No projects yet</p>
          <p>Create your first project and start tracking where your time goes.</p>
        </div>
      )}

      <div className={styles.list}>
        {projects.map((project, i) => {
          const isTracking = running?.projectId === project.id;
          const color = themedColor(project.color, theme);
          return (
            <motion.div
              key={project.id}
              className={`card ${styles.row}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <span className={styles.dot} style={{ background: color }} />
              <span className={styles.name}>{project.name}</span>
              {isTracking ? (
                <button
                  type="button"
                  className={`${styles.startBtn} ${styles.stopBtn}`}
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    void stop();
                  }}
                >
                  <Icon name="stop" size={14} />
                  <span className={`${styles.elapsed} tnum`}>{formatClock(elapsedSeconds)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.startBtn}
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    void start(project.id);
                  }}
                >
                  <Icon name="play" size={13} />
                  Start
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {projects.length > 0 && (
        <p className={styles.hint}>Tap a project to see its tasks</p>
      )}

      <ProjectFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async (input) => {
          await createProject.mutateAsync(input);
        }}
      />
    </div>
  );
}
