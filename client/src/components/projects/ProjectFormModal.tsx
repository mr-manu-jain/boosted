import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { PROJECT_PALETTE, themedColor } from '../../lib/palette';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../types';
import styles from './ProjectFormModal.module.css';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; color: string }) => Promise<void>;
  /** When set, the modal edits this project instead of creating one. */
  project?: Project | null;
}

export function ProjectFormModal({ open, onClose, onSubmit, project }: ProjectFormModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_PALETTE[0].light);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '');
      setColor(project?.color ?? PROJECT_PALETTE[0].light);
    }
  }, [open, project]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Name
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reading Books"
            maxLength={80}
            autoFocus
            required
          />
        </label>

        <div className={styles.label}>
          Color
          <div className={styles.swatches}>
            {PROJECT_PALETTE.map((slot) => (
              <button
                key={slot.light}
                type="button"
                title={slot.name}
                className={
                  color === slot.light ? `${styles.swatch} ${styles.swatchActive}` : styles.swatch
                }
                style={{ background: themedColor(slot.light, theme) }}
                onClick={() => setColor(slot.light)}
                aria-label={`Color ${slot.name}`}
                aria-pressed={color === slot.light}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
            {project ? 'Save' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
