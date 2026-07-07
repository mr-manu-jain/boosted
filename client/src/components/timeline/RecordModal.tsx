import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { useProjects, useTasks } from '../../hooks/queries';
import { api, apiErrorMessage } from '../../api/client';
import styles from './RecordModal.module.css';

interface RecordModalProps {
  open: boolean;
  onClose: () => void;
}

/** "2026-07-06T14:30" local -> ISO string with offset */
function toIso(local: string): string {
  return new Date(local).toISOString();
}

function nowLocal(minusMinutes = 0): string {
  const d = new Date(Date.now() - minusMinutes * 60_000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RecordModal({ open, onClose }: RecordModalProps) {
  const qc = useQueryClient();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: tasks = [] } = useTasks(projectId || undefined);

  useEffect(() => {
    if (open) {
      setProjectId(projects[0]?.id ?? '');
      setTaskId('');
      setStart(nowLocal(60));
      setEnd(nowLocal());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/entries', {
        projectId,
        taskId: taskId || null,
        startTime: toIso(start),
        endTime: toIso(end),
      });
      qc.invalidateQueries();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="New record" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          Project
          <select
            className="input"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskId('');
            }}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Task <span className={styles.optional}>(optional)</span>
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.rowPair}>
          <label className={styles.label}>
            Start
            <input
              className="input"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            End
            <input
              className="input"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !projectId || !start || !end}
          >
            Save record
          </button>
        </div>
      </form>
    </Modal>
  );
}
