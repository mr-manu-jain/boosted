import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { projectRouter } from './project.routes.js';
import { taskRouter } from './task.routes.js';
import { entryRouter } from './entry.routes.js';
import { reportRouter } from './report.routes.js';
import { glanceRouter } from './glance.routes.js';
import { requireAuth } from '../middleware/auth.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'boosted-api' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', requireAuth, projectRouter);
apiRouter.use('/tasks', requireAuth, taskRouter);
apiRouter.use('/entries', requireAuth, entryRouter);
apiRouter.use('/reports', requireAuth, reportRouter);
apiRouter.use('/glance', requireAuth, glanceRouter);
