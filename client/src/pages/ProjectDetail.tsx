import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  useArchiveProject,
  useArchiveTask,
  useCreateTask,
  useProjects,
  useProjectStats,
  useTasks,
  useUpdateProject,
  useUpdateTask,
} from '../hooks/queries';
import { useTimer } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { themedColor } from '../lib/palette';
import { formatClock, formatDuration } from '../lib/format';
import { Icon } from '../components/common/Icon';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import styles from './ProjectDetail.module.css';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks(id);
  const { data: stats } = useProjectStats(id);
  const createTask = useCreateTask(id ?? '');
  const updateTask = useUpdateTask(id ?? '');
  const archiveTask = useArchiveTask(id ?? '');
  const updateProject = useUpdateProject();
  const archiveProject = useArchiveProject();
  const { running, elapsedSeconds, start, stop, isPending } = useTimer();

  const [newTask, setNewTask] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  if (isLoading) return null;
  if (!project) {
    return <p>Project not found.</p>;
  }

  const color = themedColor(project.color, theme);
  const isTrackingThis = running?.projectId === project.id;

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    const name = newTask.trim();
    if (!name) return;
    await createTask.mutateAsync(name);
    setNewTask('');
  }

  async function handleArchiveProject() {
    if (!window.confirm(`Archive "${project!.name}"? Its tracked history stays in reports.`)) {
      return;
    }
    await archiveProject.mutateAsync(project!.id);
    navigate('/projects');
  }

  return (
    <div>
      <motion.div
        className={styles.hero}
        style={{
          background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 38%, #16161a) 100%)`,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.heroTop}>
          <button
            type="button"
            className={styles.back}
            onClick={() => navigate('/projects')}
            aria-label="Back to projects"
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.back}
              onClick={() => setShowEdit(true)}
              aria-label="Edit project"
            >
              <Icon name="pencil" size={17} />
            </button>
            <button
              type="button"
              className={styles.back}
              onClick={handleArchiveProject}
              aria-label="Archive project"
            >
              <Icon name="trash" size={17} />
            </button>
          </div>
        </div>

        <div className={styles.projectName}>
          <span className={styles.projectDot} />
          {project.name}
        </div>

        <div className={styles.tracking}>
          {isTrackingThis ? (
            <>
              <p className={styles.trackingLabel}>Tracking</p>
              <div className={`${styles.clock} tnum`}>{formatClock(elapsedSeconds)}</div>
              {running?.taskName && <p className={styles.trackingTask}>{running.taskName}</p>}
            </>
          ) : (
            <>
              <p className={styles.trackingLabel}>Total tracked</p>
              <div className={`${styles.clock} tnum`}>{formatClock(stats?.totalSeconds ?? 0)}</div>
            </>
          )}
        </div>

        <div className={styles.heroBtnRow}>
          {isTrackingThis ? (
            <button
              type="button"
              className={`btn ${styles.heroStop}`}
              disabled={isPending}
              onClick={() => void stop()}
            >
              <Icon name="stop" size={15} />
              Stop {running?.taskName ? 'task' : 'timer'}
            </button>
          ) : (
            <button
              type="button"
              className={`btn ${styles.heroStart}`}
              disabled={isPending}
              onClick={() => void start(project.id)}
            >
              <Icon name="play" size={15} />
              Start timer
            </button>
          )}
        </div>
      </motion.div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Tasks</h2>
      </div>

      <form className={styles.addTask} onSubmit={handleAddTask}>
        <input
          className="input"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task…"
          maxLength={120}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!newTask.trim() || createTask.isPending}
        >
          <Icon name="plus" size={17} />
          Add
        </button>
      </form>

      {tasks.length === 0 && (
        <div className={`card ${styles.empty}`}>
          Break this project into tasks — each one gets its own timer.
        </div>
      )}

      <div className={styles.taskList}>
        {tasks.map((task, i) => {
          const isTrackingTask = running?.taskId === task.id;
          const taskSeconds = stats?.byTask[task.id] ?? 0;
          return (
            <motion.div
              key={task.id}
              className={`card ${styles.taskRow}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.22 }}
            >
              <button
                type="button"
                className={task.completed ? `${styles.checkBtn} ${styles.checkDone}` : styles.checkBtn}
                onClick={() =>
                  updateTask.mutate({ id: task.id, completed: !task.completed })
                }
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                <Icon name={task.completed ? 'check' : 'circle'} size={20} />
              </button>

              <span className={task.completed ? `${styles.taskName} ${styles.taskDone}` : styles.taskName}>
                {task.name}
              </span>

              {isTrackingTask ? (
                <button
                  type="button"
                  className={`${styles.taskChip} ${styles.taskChipActive} tnum`}
                  disabled={isPending}
                  onClick={() => void stop()}
                >
                  <Icon name="stop" size={13} />
                  {formatClock(elapsedSeconds)}
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.taskChip} tnum`}
                  disabled={isPending}
                  onClick={() => void start(project.id, task.id)}
                  title="Start timer on this task"
                >
                  <Icon name="play" size={12} />
                  {taskSeconds > 0 ? formatDuration(taskSeconds) : 'Start'}
                </button>
              )}

              <button
                type="button"
                className={styles.taskDelete}
                onClick={() => archiveTask.mutate(task.id)}
                aria-label="Delete task"
              >
                <Icon name="trash" size={16} />
              </button>
            </motion.div>
          );
        })}
      </div>

      <ProjectFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        project={project}
        onSubmit={async (input) => {
          await updateProject.mutateAsync({ id: project.id, ...input });
        }}
      />
    </div>
  );
}
